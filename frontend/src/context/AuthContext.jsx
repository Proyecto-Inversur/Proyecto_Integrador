import React, { createContext, useState, useEffect, useRef } from 'react';
import { auth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from '../services/firebase';
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
      setLoading(false);
      setVerifying(false);
      isVerifyingRef.current = false;
      return { success: true, data: response.data };
    } catch (error) {
      const errorDetail = error.response?.data?.detail || error.message;
      console.error('Verification failed:', errorDetail);
      await signOut(auth);
      localStorage.removeItem('authToken');
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
  };

  const signInWithGoogleForRegistration = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken(true);
      return {
        idToken,
        email: result.user.email,
      };
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
      throw error;
    }
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
    <AuthContext.Provider value={{ currentUser, currentEntity, loading, verifying, verifyUser, signInWithGoogleForRegistration }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };