import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './src/core'),
      '@data': path.resolve(__dirname, './src/data'),
      '@scenes': path.resolve(__dirname, './src/scenes'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@fx': path.resolve(__dirname, './src/fx'),
      '@audio': path.resolve(__dirname, './src/audio')
    }
  },
  server: {
    port: 3000,
    open: false
  },
  build: {
    target: 'es2022',
    assetsInlineLimit: 0
  }
});

