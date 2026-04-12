import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { copyFileSync, existsSync, mkdirSync } from 'fs';

const libSw = path.resolve(__dirname, '../../packages/cloud/src/service-worker/sw.js');
const libRegister = path.resolve(__dirname, '../../packages/cloud/src/service-worker/register.js');
const destDir = path.resolve(__dirname, 'public');
const destSw = path.resolve(destDir, 'sw.js');
const destRegister = path.resolve(destDir, 'register.js');

if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true });
}

if (existsSync(libSw) && !existsSync(destSw)) {
  copyFileSync(libSw, destSw);
  console.log('[Demo] Service Worker copied from library');
}

if (existsSync(libRegister) && !existsSync(destRegister)) {
  copyFileSync(libRegister, destRegister);
  console.log('[Demo] Register script copied from library');
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@cloudimage/cloud': path.resolve(__dirname, '../../packages/cloud/src'),
      '@cloudimage/cloud/react': path.resolve(__dirname, '../../packages/cloud/src/react/index.ts'),
      '@cloudimage/cloud/core': path.resolve(__dirname, '../../packages/cloud/src/core'),
      '@cloudimage/cloud/adapters': path.resolve(__dirname, '../../packages/cloud/src/adapters'),
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
