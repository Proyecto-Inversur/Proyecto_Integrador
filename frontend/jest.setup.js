// Configuración inicial para Jest
import '@testing-library/jest-dom';

import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Mock para firebase.js
jest.mock('../../src/services/firebase', () => ({
  auth: {},
  onAuthStateChanged: jest.fn((auth, callback) => callback({ uid: '123' })),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

// Mock para import.meta.env
global.importMetaEnvMock = {
  VITE_FIREBASE_API_KEY: 'mock-api-key',
  // Añade otras variables de entorno si las necesitas
};
jest.doMock('import.meta', () => ({
  env: global.importMetaEnvMock,
}));