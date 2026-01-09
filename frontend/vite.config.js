// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Redirigir todas las peticiones a /api al backend
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      // También puedes configurar rutas específicas
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
});