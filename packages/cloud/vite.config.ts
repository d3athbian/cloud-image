import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-service-worker',
      closeBundle() {
        const srcSw = resolve(__dirname, 'src/service-worker/sw.js');
        const destDir = resolve(__dirname, 'dist');
        const destSw = resolve(destDir, 'sw.js');
        
        if (existsSync(srcSw)) {
          copyFileSync(srcSw, destSw);
          console.log('[Build] Service Worker copied to dist/sw.js');
        }
      }
    }
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CloudImage',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
      ],
      output: {
        preserveModules: false,
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
