/// <reference types="vitest" />

import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/vitest';
import { TextEncoder, TextDecoder } from 'util';


vi.mock('../src/services/firebase', () => ({
  auth: {},
  signOut: vi.fn(),
  getPushSubscription: vi.fn(),
  signInWithCredential: vi.fn(),
  GoogleAuthProvider: { credential: vi.fn() },
}));

afterEach(() => {
  cleanup();
});

if (!globalThis.TextEncoder) (globalThis as any).TextEncoder = TextEncoder;
if (!globalThis.TextDecoder) (globalThis as any).TextDecoder = TextDecoder;