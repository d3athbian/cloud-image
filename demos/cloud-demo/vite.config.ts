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
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});