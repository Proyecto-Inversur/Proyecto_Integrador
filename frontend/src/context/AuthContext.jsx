import React, { createContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged } from '../services/firebase';
import api from '../services/api';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEntity, setCurrentEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);

  const verifyUser = async (user, idToken) => {
    setLoading(true);
    setVerifying(true);
    let attempts = 0;
    const maxAttempts = 10;
    let success = false;
    let responseData = null;

    while (attempts < maxAttempts) {
      try {
        await sleep(1000);
        const response = await api.post(
          '/auth/verify',
          {},
          { headers: { Authorization: `Bearer ${idToken}` } }
        );
        success = true;
        responseData = response.data;
        break;
      } catch (error) {
        console.error(`Verification attempt ${attempts + 1} failed:`, error);
        attempts += 1;
      }
    }

    if (success) {
      setCurrentUser(user);
      setCurrentEntity(responseData);
    } else {
      localStorage.removeItem('authToken');
      setCurrentUser(null);
      setCurrentEntity(null);
    }

    setLoading(false);
    setVerifying(false);
    return { success, data: responseData };
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idToken = await user.getIdToken();
          localStorage.setItem('authToken', idToken);
          await verifyUser(user, idToken);
        } catch (error) {
          console.error('Error getting ID token:', error);
          localStorage.removeItem('authToken');
          setCurrentUser(null);
          setCurrentEntity(null);
          setLoading(false);
          setVerifying(false);
        }
      } else {
        localStorage.removeItem('authToken');
        setCurrentUser(null);
        setCurrentEntity(null);
        setLoading(false);
        setVerifying(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, currentEntity, loading, verifying, verifyUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };