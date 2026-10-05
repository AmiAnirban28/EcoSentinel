import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      ...Object.fromEntries(
        ['/maps', '/api'].map((route) => [route, {
          target: `http://127.0.0.1:${process.env.ECOSENTINEL_MAPS_PORT || '5173'}`,
          changeOrigin: true,
          ws: true,
        }]),
      ),
      ...Object.fromEntries(
        [
          '/cesium',
        '/models',
        '/style.css',
        '/logo.svg',
        '/pin.svg',
        '/location.svg',
        '/visual-presets.svg',
        '/mic.svg',
        '/ai-mountain-badge.svg',
        '/ai-mountain-badge.png',
        '/ai-mountain-badge-64.png',
        ].map((route) => [route, {
          target: `http://127.0.0.1:${process.env.ECOSENTINEL_MAPS_PORT || '5173'}`,
          changeOrigin: true,
          rewrite: (path) => `/maps${path}`,
        }]),
      ),
    },
  },
  resolve: {
    alias: {'@': path.resolve(__dirname, '.')},
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Cache big vendor libs separately from app code.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/three/')) return 'three';
          if (id.includes('@react-three') || id.includes('three-stdlib') || id.includes('troika')) return 'r3f';
          if (id.includes('/motion') || id.includes('framer-motion')) return 'motion';
        },
      },
    },
  },
});
