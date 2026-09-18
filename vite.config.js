import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/trust/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/superadmin/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/superAdmin/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/trust/print-receipt.php': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/trust/print_receipt.php': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/trust/download-invoice': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/trust/download_invoice': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    },
    host: true
  }
});
