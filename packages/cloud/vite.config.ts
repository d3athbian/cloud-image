import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync } from 'fs';
import { buildSync } from 'esbuild';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'build-service-worker',
      // Runs after Vite has finished writing dist/ so outDir already exists.
      closeBundle() {
        const destDir = resolve(__dirname, 'dist');
        mkdirSync(destDir, { recursive: true });

        // Compile sw.ts → dist/sw.js (IIFE, self-contained, no external deps)
        buildSync({
          entryPoints: [resolve(__dirname, 'src/service-worker/sw.ts')],
          outfile: resolve(destDir, 'sw.js'),
          bundle: true,
          format: 'iife',
          platform: 'browser',
          target: 'es2020',
          minify: true,
        });
        console.log('[Build] Service Worker compiled → dist/sw.js');

        // register.ts is plain JS — copy as-is (no TS-specific syntax)
        copyFileSync(
          resolve(__dirname, 'src/service-worker/register.ts'),
          resolve(destDir, 'register.js'),
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
