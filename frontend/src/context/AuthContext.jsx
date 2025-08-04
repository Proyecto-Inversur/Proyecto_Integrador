import React, { createContext, useState, useEffect, useRef } from 'react';
import { auth, signOut, getPushSubscription, signInWithCredential, GoogleAuthProvider } from '../services/firebase';
import { saveSubscription } from '../services/notificaciones';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { googleClientId } from '../config';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEntity, setCurrentEntity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [singingIn, setSingingIn] = useState(false);
  const navigate = useNavigate();
  const isVerifyingRef = useRef(false);
  const isVerifiedRef = useRef(false);

  const verifyUser = async (user, idToken) => {
    isVerifyingRef.current = true;
    try {
      setLoading(true);
      setVerifying(true);

      const response = await api.post(
        '/auth/verify',
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      isVerifiedRef.current = true;
      setCurrentUser(user);
      setCurrentEntity(response.data);

      const subscription = await getPushSubscription();
      if (subscription) {
        await saveSubscription({
          ...subscription.toJSON(),
          firebase_uid: response.data.data.uid,
          device_info: navigator.userAgent
        });
      }
    } catch (error) {
      const errorDetail = error.response?.data?.detail || error.message;
      console.error('Final verification error:', errorDetail);
      const errorMessage =
        error.response?.status === 403
          ? 'Usuario no registrado. Por favor, crea una cuenta.'
          : error.response?.status === 401
          ? `Token de autenticación inválido: ${errorDetail}`
          : 'Error al verificar el usuario.';
      await logOut(errorMessage);
      return { success: false, data: null };
    } finally {
      isVerifyingRef.current = false;
      setLoading(false);
      setVerifying(false);
    }
  };

  const logOut = async (error) => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('googleIdToken');
    sessionStorage.removeItem('googleIdToken');
    setLoading(false);
    setVerifying(false);
    isVerifyingRef.current = false;
    isVerifiedRef.current = false;
    setCurrentUser(null);
    setCurrentEntity(null);
    await signOut(auth);
    if (error) {
      navigate('/login', { state: { error: error } });
    } else {
      navigate('/login');
    }
  };

  const signInWithGoogle = async (loginIn) => {
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
              if (loginIn) {
                localStorage.setItem('googleIdToken', idToken);
                sessionStorage.setItem('googleIdToken', idToken);
                setSingingIn(true);
              } else {
                const emailResponse = await fetch(
                  `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${idToken}`
                );
                const tokenInfo = await emailResponse.json();
                if (tokenInfo.email) {
                  resolve({ idToken, email: tokenInfo.email });
                } else {
                  reject(new Error('Failed to retrieve email from Google ID token'));
                }
              }
            } catch (error) {
              console.error('Error processing Google ID token:', error);
              reject(error);
            }
          },
          ux_mode: 'popup',
        });
        window.google.accounts.id.prompt();
      };
      script.onerror = () => reject(new Error('Failed to load Google Sign-In SDK'));
      document.body.appendChild(script);
    });
  };

  const retrySignIn = async (credential, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const result = await signInWithCredential(auth, credential);
        return result;
      } catch (error) {
        if (error.code === 'auth/network-request-failed' && i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const idToken = sessionStorage.getItem('googleIdToken') || localStorage.getItem('googleIdToken');
      if (!idToken) {
        return; // No token, no action
      }
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await retrySignIn(credential);
      const user = result.user;
      if (user) {
        const firebaseToken = await user.getIdToken();
        localStorage.setItem('authToken', firebaseToken);
        sessionStorage.setItem('authToken', firebaseToken);
        await verifyUser(user, firebaseToken);
      } else {
        await logOut('No se pudo obtener el usuario');
      }
    } catch (error) {
      console.error('Error en Google Sign-In:', error);
      await logOut(error.message);
    }
  };

  // Ejecutar al cargar la página
  useEffect(() => {
    handleGoogleSignIn();
  }, []);

  // Ejecutar cuando se establece un nuevo token
  useEffect(() => {
    if (singingIn) {
      setSingingIn(false); // Resetear para evitar bucles
      handleGoogleSignIn();
    }
  }, [singingIn]);

  return (
    <AuthContext.Provider value={{ currentUser, currentEntity, loading, verifying, signInWithGoogle, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };