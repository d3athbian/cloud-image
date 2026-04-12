import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, existsSync } from 'fs';

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

        const srcRegister = resolve(__dirname, 'src/service-worker/register.js');
        const destRegister = resolve(destDir, 'register.js');
        
        if (existsSync(srcRegister)) {
          copyFileSync(srcRegister, destRegister);
          console.log('[Build] Register script copied to dist/register.js');
        }
      }
    }
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        core: resolve(__dirname, 'src/core/index.ts'),
        adapters: resolve(__dirname, 'src/adapters/index.ts'),
        react: resolve(__dirname, 'src/react/index.ts'),
      },
      name: 'CloudImage',
      formats: ['es'],
      fileName: (format, name) => `${name}.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
      ],
      output: {
        manualChunks(id: string) {
          if (id.includes('/core/')) {
            return 'cloud-core';
          }
          if (id.includes('/adapters/')) {
            return 'cloud-adapters';
          }
          if (id.includes('/react/')) {
            return 'cloud-react';
          }
        },
        chunkFileNames: '[name].js',
        entryFileNames: '[name].js',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
    },
  },
});
