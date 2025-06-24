import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, linkWithPopup } from 'firebase/auth';
import { firebaseConfig } from '../config';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

export { database, auth, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, linkWithPopup };