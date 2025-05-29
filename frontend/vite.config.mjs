import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import istanbul from 'vite-plugin-istanbul';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  plugins: [
    react(),
    istanbul({
      include: 'src/*',
      exclude: [
        'node_modules',
        'test/',
        'cypress/',
        'src/services/firebase.js',
      ],
      extension: ['.js', '.jsx', '.ts', '.tsx'],
      requireEnv: false,
    }),
  ],
  build: {
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.js',
    exclude: [...configDefaults.exclude, 'cypress/**'],
    coverage: {
      provider: 'istanbul',
      exclude: [
        'node_modules/**',
        'test/**',
        'cypress/**',
        'src/services/firebase.js',
      ],
    },
  },
});