import React, { createContext, useState, useEffect, useRef } from 'react';
import { auth, onAuthStateChanged, GoogleAuthProvider, signOut } from '../services/firebase';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEntity, setCurrentEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const navigate = useNavigate();
  const isVerifyingRef = useRef(false);
  const isVerifiedRef = useRef(false);

  const verifyUser = async (user, idToken) => {
    if (isVerifyingRef.current) {
      console.log('Verification already in progress, skipping.');
      return { success: false, data: null };
    }
    if (isVerifiedRef.current) {
      console.log('User already verified, skipping.');
      setLoading(false);
      setVerifying(false);
      return { success: true, data: currentEntity };
    }
    isVerifyingRef.current = true;
    setLoading(true);
    setVerifying(true);

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const response = await api.post(
          '/auth/verify',
          {},
          { headers: { Authorization: `Bearer ${idToken}` } }
        );
        console.log('Verification succeeded:', response.data);
        isVerifiedRef.current = true;
        setCurrentUser(user);
        setCurrentEntity(response.data);
        localStorage.setItem('activeUserId', user.uid);
        setLoading(false);
        setVerifying(false);
        isVerifyingRef.current = false;
        return { success: true, data: response.data };
      } catch (error) {
        attempts++;
        const errorDetail = error.response?.data?.detail || error.message;
        console.error(`Verification attempt ${attempts} failed:`, errorDetail);
        if (attempts === maxAttempts) {
          await signOut(auth);
          localStorage.removeItem('authToken');
          localStorage.removeItem('activeUserId');
          setCurrentUser(null);
          setCurrentEntity(null);
          setLoading(false);
          setVerifying(false);
          isVerifyingRef.current = false;
          isVerifiedRef.current = false;
          const errorMessage = error.response?.status === 403
            ? 'Usuario no registrado. Por favor, crea una cuenta.'
            : error.response?.status === 401
            ? `Token de autenticación inválido: ${errorDetail}`
            : 'Error al verificar el usuario.';
          navigate('/login', { state: { error: errorMessage } });
          return { success: false, data: null };
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const signInWithGoogleForRegistration = async () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: async (response) => {
            try {
              const idToken = response.credential;
              const emailResponse = await fetch(
                `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${idToken}`
              );
              const tokenInfo = await emailResponse.json();
              if (tokenInfo.email) {
                resolve({ idToken, email: tokenInfo.email });
              } else {
                reject(new Error('Failed to retrieve email from Google ID token'));
              }
            } catch (error) {
              console.error('Error processing Google ID token:', error);
              reject(error);
            }
          },
        });
        window.google.accounts.id.prompt();
      };
      script.onerror = () => reject(new Error('Failed to load Google Sign-In SDK'));
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const activeUserId = localStorage.getItem('activeUserId');
      if (user && user.uid === activeUserId && !isVerifyingRef.current && !isVerifiedRef.current) {
        try {
          const idToken = await user.getIdToken(true);
          localStorage.setItem('authToken', idToken);
          await verifyUser(user, idToken);
        } catch (error) {
          console.error('Error getting ID token:', error);
          await signOut(auth);
          localStorage.removeItem('authToken');
          localStorage.removeItem('activeUserId');
          setCurrentUser(null);
          setCurrentEntity(null);
          setLoading(false);
          setVerifying(false);
          isVerifiedRef.current = false;
          navigate('/login', { state: { error: 'Error al obtener el token de autenticación.' } });
        }
      } else if (!user || user.uid !== activeUserId) {
        localStorage.removeItem('authToken');
        setCurrentUser(null);
        setCurrentEntity(null);
        setLoading(false);
        setVerifying(false);
        isVerifiedRef.current = false;
        if (!user) localStorage.removeItem('activeUserId');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ currentUser, currentEntity, loading, verifying, verifyUser, signInWithGoogleForRegistration }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };