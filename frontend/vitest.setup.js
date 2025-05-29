import '@testing-library/jest-dom';
import { vi } from 'vitest';

import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Mock para import.meta.env
vi.mock('import.meta', () => ({
  env: {
    VITE_FIREBASE_API_KEY: 'mock-api-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'mock-auth-domain',
    VITE_FIREBASE_PROJECT_ID: 'mock-project-id',
    VITE_FIREBASE_STORAGE_BUCKET: 'mock-storage-bucket',
    VITE_FIREBASE_MESSAGING_SENDER_ID: 'mock-sender-id',
    VITE_FIREBASE_APP_ID: 'mock-app-id',
  },
}));