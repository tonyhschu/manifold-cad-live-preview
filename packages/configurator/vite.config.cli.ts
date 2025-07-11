import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/cli/index.ts'),
      name: 'ManifoldCLI',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: [
        // Node.js built-ins
        'fs', 'path', 'process', 'url',
        // Dependencies that should be external
        'commander', 'glob', 'chokidar'
      ],
      output: {
        banner: '#!/usr/bin/env node',
        format: 'es'
      }
    },
    outDir: 'dist/cli',
    target: 'node18',
    minify: false // Keep readable for debugging
  },
  esbuild: {
    target: 'node18',
    format: 'esm'
  }
});
