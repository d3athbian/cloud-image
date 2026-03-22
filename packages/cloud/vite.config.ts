import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CloudImage',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      // Explicitly exclude demos from bundle
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        /^demos/,
      ],
      output: {
        // Ensure demos directory is not included
        preserveModules: false,
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
