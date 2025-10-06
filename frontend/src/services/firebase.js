import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserPopupRedirectResolver,
  signOut as realSignOut,
  GoogleAuthProvider as RealGoogleAuthProvider,
  signInWithCredential as realSignInWithCredential,
  onIdTokenChanged as realOnIdTokenChanged,
} from 'firebase/auth';
import { config } from '../config';

// Detect test/e2e runtime (Vite test mode or Cypress present)
const isTestRuntime =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE === 'test') ||
  (typeof window !== 'undefined' && !!window.Cypress);

let database;
let auth;
let signOut;
let GoogleAuthProvider;
let signInWithCredential;
let onIdTokenChanged;

if (isTestRuntime) {
  // Lightweight stubs to avoid hitting Firebase/ServiceWorker in E2E
  const app = initializeApp(config.firebaseConfig);
  database = getDatabase(app);
  const fakeUser = {
    uid: 'test-uid',
    getIdToken: async () => 'e2e-token',
  };
  auth = { currentUser: fakeUser };
  GoogleAuthProvider = { credential: (idToken) => ({ idToken }) };
  signInWithCredential = async () => ({ user: fakeUser });
  signOut = async () => {};
  onIdTokenChanged = () => () => {};
} else {
  const app = initializeApp(config.firebaseConfig);
  database = getDatabase(app);
  auth = initializeAuth(app, {
    persistence: indexedDBLocalPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  });
  signOut = realSignOut;
  GoogleAuthProvider = RealGoogleAuthProvider;
  signInWithCredential = realSignInWithCredential;
  onIdTokenChanged = realOnIdTokenChanged;
}

// We rely on the standard Push API for notifications
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

const getPushSubscription = async () => {
  try {
    if (isTestRuntime) return null;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.webPushPublicKey),
    });
    return subscription;
  } catch (err) {
    console.error('Error subscribing for web push:', err);
    return null;
  }
};

export { database, auth, getPushSubscription, signOut, GoogleAuthProvider, signInWithCredential, onIdTokenChanged };
