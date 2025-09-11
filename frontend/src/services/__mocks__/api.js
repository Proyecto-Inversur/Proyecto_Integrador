import { vi } from 'vitest';

export default {
  get: vitest.fn(() => Promise.resolve({ data: [] })),
  post: vitest.fn(() => Promise.resolve({ data: {} })),
  put: vitest.fn(() => Promise.resolve({ data: {} })),
  delete: vitest.fn(() => Promise.resolve({})),
};
  
