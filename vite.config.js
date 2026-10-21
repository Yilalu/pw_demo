import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward frontend API calls to Express during local development.
      '/api': 'http://localhost:3000',
    },
  },
});
