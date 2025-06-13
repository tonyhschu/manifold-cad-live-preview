import { defineConfig } from 'vite';

export default defineConfig({
  // Enable top-level await for Manifold WASM loading
  esbuild: {
    target: 'es2022'
  },
  optimizeDeps: {
    exclude: ['manifold-3d']
  },
  server: {
    port: 5173,
    open: true
  }
});
