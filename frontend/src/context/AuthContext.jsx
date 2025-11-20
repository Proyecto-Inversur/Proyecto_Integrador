import React, { createContext, useEffect } from 'react';
import { config } from '../config';
import { loadGoogleSDK } from '../utils/googleSignIn';
import { auth, onIdTokenChanged } from '../services/firebase';
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
    isLoggingOut,
  } = useAuth();
  const signInWithGoogle = async (loginIn) => {
    // Fast path para E2E (Cypress): evita SDK de Google y dispara el flujo
    if (typeof window !== 'undefined' && window.Cypress) {
      const fakeIdToken = 'test-id-token';
      if (loginIn) {
        localStorage.setItem('googleIdToken', fakeIdToken);
        sessionStorage.setItem('googleIdToken', fakeIdToken);
        startSigningIn();
        return Promise.resolve();
      } else {
        return Promise.resolve({ idToken: fakeIdToken, email: 'test@example.com' });
      }
    }

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

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          await verifyUser(token);
        } catch (err) {
          await logOut();
        }
      } else if (!user) {
        if (isLoggingOut.current) {
          isLoggingOut.current = false;
          return;
        }
        await handleGoogleSignIn();
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (singingIn) {
      stopSigningIn();
      handleGoogleSignIn(false);
    }
  }, [singingIn]);

  useEffect(() => {
    const handleLogoutEvent = () => {
      logOut();
    };
    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, [logOut]);

  return (
    <AuthContext.Provider
      value={{ currentEntity, loading, verifying, signInWithGoogle, logOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
