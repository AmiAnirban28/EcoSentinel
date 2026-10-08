import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, mergeConfig} from 'vite';
import mapsConfig from './maps/vite.config.js';

export default defineConfig(async ({command, mode}) => {
  const integratedMapsConfig = await mapsConfig({command, mode});

  return mergeConfig(integratedMapsConfig, {
    base: '/',
    plugins: [react(), tailwindcss()],
    server: {
      host: '0.0.0.0',
      port: 3000,
    },
    resolve: {
      alias: {'@': path.resolve(__dirname, '.')},
    },
    build: {
      target: 'es2022',
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'index.html'),
          'maps/index': path.resolve(__dirname, 'maps/index.html'),
        },
        output: {
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
});
