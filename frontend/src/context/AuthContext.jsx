import React, { createContext, useState, useEffect, useRef } from 'react';
import { auth, onAuthStateChanged, signOut } from '../services/firebase';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { googleClientId } from '../config';

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
    isVerifyingRef.current = true;
    try {
      setLoading(true);
      setVerifying(true);

      try {
        const response = await api.post(
          '/auth/verify',
          {},
          { headers: { Authorization: `Bearer ${idToken}` } }
        );
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Verification succeeded:', response.data);
        isVerifiedRef.current = true;
        setCurrentUser(user);
        setCurrentEntity(response.data);
        return { success: true, data: response.data };
      } catch (error) {
        attempts++;
        const errorDetail = error.response?.data?.detail || error.message;
        console.error(`Verification attempt ${attempts} failed:`, errorDetail);
        if (attempts === maxAttempts) {
          throw error;
        }
      }
    } catch (error) {
      const errorDetail = error.response?.data?.detail || error.message;
      console.error('Final verification error:', errorDetail);
      try {
        await signOut(auth);
        localStorage.removeItem('authToken');
      } catch (signOutError) {
        console.error('Sign-out failed:', signOutError);
      }
      setCurrentUser(null);
      setCurrentEntity(null);
      isVerifiedRef.current = false;
      const errorMessage =
        error.response?.status === 403
          ? 'Usuario no registrado. Por favor, crea una cuenta.'
          : error.response?.status === 401
          ? `Token de autenticación inválido: ${errorDetail}`
          : 'Error al verificar el usuario.';
      navigate('/login', { state: { error: errorMessage } });
      return { success: false, data: null };
    } finally {
      isVerifyingRef.current = false;
      setLoading(false);
      setVerifying(false);
    }
  };

  const logOut = async () => {
    await signOut(auth);
    localStorage.removeItem('authToken');
    setCurrentUser(null);
    setCurrentEntity(null);
    setLoading(false);
    setVerifying(false);
    isVerifyingRef.current = false;
    isVerifiedRef.current = false;
    navigate('/login');
  }

  const signInWithGoogleForRegistration = async () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
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
      if (user && !isVerifyingRef.current && !isVerifiedRef.current) {
        try {
          const idToken = await user.getIdToken(true);
          localStorage.setItem('authToken', idToken);
          await verifyUser(user, idToken);
        } catch (error) {
          console.error('Error getting ID token:', error);
          await signOut(auth);
          localStorage.removeItem('authToken');
          setCurrentUser(null);
          setCurrentEntity(null);
          setLoading(false);
          setVerifying(false);
          isVerifiedRef.current = false;
          navigate('/login', { state: { error: 'Error al obtener el token de autenticación.' } });
        }
      } else if (!user) {
        localStorage.removeItem('authToken');
        setCurrentUser(null);
        setCurrentEntity(null);
        setLoading(false);
        setVerifying(false);
        isVerifiedRef.current = false;
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ currentUser, currentEntity, loading, verifying, verifyUser, signInWithGoogleForRegistration, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };