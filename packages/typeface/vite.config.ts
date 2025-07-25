import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
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
