import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { libInjectCss } from 'vite-plugin-lib-inject-css';
import { resolve } from 'path';
import { copyFileSync, mkdirSync } from 'fs';
import { buildSync } from 'esbuild';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    libInjectCss(),
    {
      name: 'build-service-worker',
      closeBundle() {
        mkdirSync(resolve(__dirname, 'dist'), { recursive: true });

        buildSync({
          entryPoints: [resolve(__dirname, 'src/service-worker/sw.ts')],
          outfile: resolve(__dirname, 'dist/sw.js'),
          bundle: true,
          format: 'iife',
          platform: 'browser',
          target: 'es2020',
          minify: true,
        });
        console.log('[Build] Service Worker compiled → dist/sw.js');

        copyFileSync(
          resolve(__dirname, 'src/service-worker/register.ts'),
          resolve(__dirname, 'dist/register.js'),
        );
        console.log('[Build] Register script copied → dist/register.js');
      },
    },
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        core: resolve(__dirname, 'src/core/index.ts'),
        adapters: resolve(__dirname, 'src/adapters/index.ts'),
        react: resolve(__dirname, 'src/react/index.ts'),
        debugger: resolve(__dirname, 'src/debugger/index.ts'),
      },
      name: 'CloudImage',
      formats: ['es'],
      fileName: (format, name) => `${name}.js`,
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'jotai'],
      output: {
        manualChunks(id: string) {
          if (id.includes('/core/')) return 'cloud-core';
          if (id.includes('/adapters/')) return 'cloud-adapters';
          if (id.includes('/react/')) return 'cloud-react';
          if (id.includes('/debugger/')) return 'debugger';
        },
      },
    },
  },
});
