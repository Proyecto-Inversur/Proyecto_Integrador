/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'; 
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],     
    include: ['tests/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './tests/coverage',
      
      include: ['src/**/*.{js,jsx,ts,tsx}'],

      exclude: [
        'src/main.tsx',
        'src/main.jsx',
        'src/config.js',
        'src/vite-env.d.ts',
        'src/context/', // Los contextos suelen ser solo "boilerplate"
        'src/routes.jsx', // Es un archivo de configuración
        'src/styles/',
        'src/assets/',
        '**/__mocks__/**',
        '**/node_modules/**',
        '**/tests/**',
      ],
    },
  },
});