import { useState, useReducer, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { auth, signOut, GoogleAuthProvider, signInWithCredential } from '../services/firebase';
import usePushSubscription from './usePushSubscription';

const FRIENDLY_ERRORS = {
  401: 'No se pudo validar tu sesión. Volvé a iniciar sesión.',
  403: 'Usuario no registrado. Por favor, crea una cuenta.',
};

export function buildUserAuthError(error, fallback = 'Ocurrió un problema. Intentá de nuevo.') {
  const status = error?.response?.status;
  const detail = error?.response?.data?.detail || error?.message;

  console.error('Auth error:', {
    status,
    detail,
    stack: error?.stack,
    url: error?.config?.url,
    method: error?.config?.method,
  });

  return FRIENDLY_ERRORS[status] || fallback;
}

const initialState = { loading: false, verifying: false, singingIn: false };
function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.value };
    case 'SET_VERIFYING':
      return { ...state, verifying: action.value };
    case 'SET_SIGNING_IN':
      return { ...state, singingIn: action.value };
    default:
      return state;
  }
}

export default function useAuth() {
  const [currentEntity, setCurrentEntity] = useState(() => {
    try {
      const stored =
        sessionStorage.getItem('currentEntity') ||
        localStorage.getItem('currentEntity');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Error parsing currentEntity from storage:', e);
      return null;
    }
  });
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();
  const isVerifyingRef = useRef(false);
  const isVerifiedRef = useRef(false);
  const { subscription, subscribe, unsubscribe } = usePushSubscription();

  const verifyUser = async (idToken) => {
    isVerifyingRef.current = true;
    for (let i = 0; i < 3; i++) {
      try {
        dispatch({ type: 'SET_LOADING', value: true });
        dispatch({ type: 'SET_VERIFYING', value: true });

        const response = await api.post(
          '/auth/verify',
          {},
          { headers: { Authorization: `Bearer ${idToken}` } }
        );

        await new Promise((resolve) => setTimeout(resolve, 1000));
        isVerifiedRef.current = true;
        setCurrentEntity(response.data);
        localStorage.setItem('authToken', idToken);
        sessionStorage.setItem('authToken', idToken);
        localStorage.setItem('currentEntity', JSON.stringify(response.data));
        sessionStorage.setItem('currentEntity', JSON.stringify(response.data));

        await subscribe(response?.data?.data?.uid);

        return { success: true, data: response.data };
      } catch (error) {
        if (i === 2) {
          const userMessage = buildUserAuthError(error, 'Error al verificar el usuario.');
          await logOut(userMessage);
          return { success: false, data: null };
        }
      } finally {
        isVerifyingRef.current = false;
        dispatch({ type: 'SET_LOADING', value: false });
        dispatch({ type: 'SET_VERIFYING', value: false });
      }
    }
  };

  const logOut = async (error) => {
    try {
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      localStorage.removeItem('googleIdToken');
      sessionStorage.removeItem('googleIdToken');
      localStorage.removeItem('currentEntity');
      sessionStorage.removeItem('currentEntity');
      dispatch({ type: 'SET_LOADING', value: false });
      dispatch({ type: 'SET_VERIFYING', value: false });
      isVerifyingRef.current = false;
      isVerifiedRef.current = false;
      setCurrentEntity(null);
      await unsubscribe();
      await signOut(auth);
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
    } finally {
      if (error) {
        navigate('/login', { state: { error } });
      } else {
        navigate('/login');
      }
    }
  };

  const retrySignIn = async (retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const idToken =
          sessionStorage.getItem('googleIdToken') ||
          localStorage.getItem('googleIdToken');
        if (!idToken) {
          return;
        }
        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, credential);
        return result;
      } catch (error) {
        if (error.code === 'auth/network-request-failed' && i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  };

  const startSigningIn = () => dispatch({ type: 'SET_SIGNING_IN', value: true });
  const stopSigningIn = () => dispatch({ type: 'SET_SIGNING_IN', value: false });

  return {
    currentEntity,
    loading: state.loading,
    verifying: state.verifying,
    singingIn: state.singingIn,
    verifyUser,
    logOut,
    retrySignIn,
    startSigningIn,
    stopSigningIn,
    subscription,
  };
}
