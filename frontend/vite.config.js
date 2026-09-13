import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: { rollupOptions: { input: { main: 'index.html', admin: 'admin.html', control: 'control/index.html' } } },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
})
