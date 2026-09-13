import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: { rollupOptions: { input: mode === 'admin' ? 'admin.html' : 'index.html' } },
  server: { host: '0.0.0.0', port: 3000, allowedHosts: true }
}));
