import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { initializeAuth, indexedDBLocalPersistence, browserPopupRedirectResolver, signOut, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { firebaseConfig, webPushPublicKey } from '../config';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = initializeAuth(app, {
  persistence: indexedDBLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver
});
// We rely on the standard Push API for notifications

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

const getPushSubscription = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(webPushPublicKey)
    });
    return subscription;
  } catch (err) {
    console.error('Error subscribing for web push:', err);
    return null;
  }
};

export { database, auth, getPushSubscription, signOut, GoogleAuthProvider, signInWithCredential };
