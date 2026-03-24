import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFileSync, existsSync, mkdirSync } from 'fs';

const libSw = path.resolve(__dirname, '../../packages/cloud/src/service-worker/sw.js');
const destDir = path.resolve(__dirname, 'public');
const destSw = path.resolve(destDir, 'sw.js');

if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true });
}

if (existsSync(libSw) && !existsSync(destSw)) {
  copyFileSync(libSw, destSw);
  console.log('[Demo] Service Worker copied from library');
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@cloudimage/cloud': path.resolve(__dirname, '../../packages/cloud/src')
    }
  },
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
