import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const libSw = path.resolve(__dirname, '../../packages/cloud/dist/sw.js');
const libRegister = path.resolve(__dirname, '../../packages/cloud/dist/register.js');
const destDir = path.resolve(__dirname, 'public');
const destSw = path.resolve(destDir, 'sw.js');
const destRegister = path.resolve(destDir, 'register.js');

if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true });
}

if (existsSync(libSw)) {
  copyFileSync(libSw, destSw);
  console.log('[Demo] Service Worker copied from library');
}

if (existsSync(libRegister)) {
  copyFileSync(libRegister, destRegister);
  console.log('[Demo] Register script copied from library');
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@cloudimage/cloud/debugger': path.resolve(__dirname, '../../packages/cloud/src/debugger/index.ts'),
      '@cloudimage/cloud/react': path.resolve(__dirname, '../../packages/cloud/src/react/index.ts'),
      '@cloudimage/cloud/core': path.resolve(__dirname, '../../packages/cloud/src/core/index.ts'),
      '@cloudimage/cloud/adapters': path.resolve(__dirname, '../../packages/cloud/src/adapters/index.ts'),
      '@cloudimage/cloud': path.resolve(__dirname, '../../packages/cloud/src/index.ts'),
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