import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Remove lucide-react from exclude so Vite can optimize it correctly.
  // optimizeDeps: {
  //   exclude: ['lucide-react'],
  // },
});
