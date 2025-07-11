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
        'fs', 'path', 'process', 'url', 'os', 'crypto', 'util', 'events', 'stream',
        'http', 'https', 'net', 'tls', 'child_process', 'worker_threads', 'module',
        'assert', 'buffer', 'zlib', 'querystring', 'tty',
        // Node.js built-ins with node: prefix
        'node:fs', 'node:path', 'node:process', 'node:url', 'node:os', 'node:crypto',
        'node:util', 'node:events', 'node:stream', 'node:http', 'node:https', 'node:net',
        'node:tls', 'node:child_process', 'node:worker_threads', 'node:module',
        'node:assert', 'node:buffer', 'node:zlib', 'node:querystring', 'node:tty',
        'node:fs/promises', 'node:perf_hooks', 'node:dns', 'node:readline', 'node:v8',
        'node:http2',
        // Dependencies that should be external
        'commander', 'glob', 'chokidar', 'vite', 'rollup', 'esbuild',
        // Native modules that can't be bundled
        'fsevents'
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
