import React, { createContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged } from '../services/firebase';
import api from '../services/api';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEntity, setCurrentEntity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idToken = await user.getIdToken();
          localStorage.setItem('authToken', idToken);
          await sleep(5000);
          // Verificar entidad con el backend
          const response = await api.post('/auth/verify', {}, {
            headers: { Authorization: `Bearer ${idToken}` }
          });
          setCurrentUser(user);
          setCurrentEntity(response.data);
        } catch (error) {
          console.error('Error verifying user:', error);
          localStorage.removeItem('authToken');
          setCurrentUser(null);
          setCurrentEntity(null);
        }
      } else {
        localStorage.removeItem('authToken');
        setCurrentUser(null);
        setCurrentEntity(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, currentEntity, loading }}>
      {children}
    </AuthContext.Provider>
  );
};