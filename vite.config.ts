import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/interactive-information-theory/',
  build: {
    rollupOptions: {
      output: {
        // KaTeX caches independently of the app; the home page stays KaTeX-free.
        manualChunks: { katex: ['katex'] },
      },
    },
  },
});