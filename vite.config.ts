import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': `${__dirname}src`,
    },
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/pdf-lib')) return 'pdf-lib';
          if (id.includes('node_modules/pdfjs-dist')) return 'pdfjs';
          if (id.includes('node_modules/xlsx')) return 'xlsx';
          if (id.includes('node_modules/papaparse')) return 'papaparse';
          if (id.includes('node_modules/framer-motion')) return 'framer-motion';
        },
      },
    },
  },
  // @ts-expect-error vitest augments this field at runtime
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
  },
});
