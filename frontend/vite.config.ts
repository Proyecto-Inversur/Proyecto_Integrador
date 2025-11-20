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
    reporters: ['default', ['junit', { outputFile: 'junit.xml' }]],
    outputFile: 'junit.xml',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov', 'clover'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      
      // Aca agregamos los archivos y carpetas a excluir.
      exclude: [
        'src/main.tsx',
        'src/main.jsx',
        'src/config.js',
        
        // Excluir toda la carpeta de servicios
        'src/services/',

        // Excluir hooks específicos del mapa
        'src/hooks/maps/useLeafletMap.js',
        'src/hooks/maps/useMapa.jsx',
        'src/hooks/maps/useMapRoutes.js',
        'src/hooks/maps/useRutaNavegacion.js',

        'src/utils/',


        'src/context/',
        'src/routes.jsx',
        'src/styles/',
        '**/node_modules/**',
        '**/tests/**',
      ],
    },
  },
});