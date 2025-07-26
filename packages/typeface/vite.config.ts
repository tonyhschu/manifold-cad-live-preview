import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ManifoldTypeface',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        '@manifold-studio/wrapper',
        'opentype.js'
      ],
    },
    sourcemap: true,
  },
  test: {
    environment: 'node',
  },
});
