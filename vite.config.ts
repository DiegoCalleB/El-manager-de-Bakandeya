import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    esbuild: {
      legalComments: 'none',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'esnext',
      sourcemap: false,
      reportCompressedSize: false,
      minify: false,
    },
    server: {
      hmr: false,
      ws: false,
      watch: null,
    },
  };
});
