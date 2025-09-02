import React, { createContext, useEffect } from 'react';
import { config } from '../config';
import { loadGoogleSDK } from '../utils/googleSignIn';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from "firebase/auth";
import useAuth, { buildUserAuthError } from '../hooks/useAuth';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const {
    currentEntity,
    loading,
    verifying,
    singingIn,
    verifyUser,
    logOut,
    retrySignIn,
    startSigningIn,
    stopSigningIn,
  } = useAuth();
  const signInWithGoogle = async (loginIn) => {
    await loadGoogleSDK();
    return new Promise((resolve, reject) => {
      try {
        window.google.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: async (response) => {
            try {
              const idToken = response.credential;
              if (loginIn) {
                localStorage.setItem('googleIdToken', idToken);
                sessionStorage.setItem('googleIdToken', idToken);
                startSigningIn();
              } else {
                const emailResponse = await fetch(
                  `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${idToken}`
                );
                const tokenInfo = await emailResponse.json();
                if (tokenInfo.email) {
                  resolve({ idToken, email: tokenInfo.email });
                } else {
                  throw new Error('Failed to retrieve email from Google ID token');
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
      } catch (e) {
        reject(new Error('No se pudo inicializar Google Sign-In.'));
      }
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await retrySignIn();
      const user = result?.user;
      if (user) {
        const firebaseToken = await auth.currentUser.getIdToken(true);
        localStorage.setItem('authToken', firebaseToken);
        sessionStorage.setItem('authToken', firebaseToken);
        await verifyUser(firebaseToken);
      } else {
        await logOut('No se pudo obtener el usuario.');
      }
    } catch (error) {
      const userMessage = buildUserAuthError(error, 'No se pudo completar el inicio de sesión.');
      await logOut(userMessage);
    }
  };

  // Ejecutar al cargar la página
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && currentEntity) {
        try {
          const token = await user.getIdToken(true);
          await verifyUser(token);
        } catch (err) {
          await logOut();
        }
      } else if (!user) {
        await handleGoogleSignIn();
      }
    });

    return () => unsubscribe();
  }, []);

  // Ejecutar cuando se establece un nuevo token
  useEffect(() => {
    if (singingIn) {
      stopSigningIn();
      handleGoogleSignIn(false);
    }
  }, [singingIn]);

  return (
    <AuthContext.Provider
      value={{ currentEntity, loading, verifying, signInWithGoogle, logOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
