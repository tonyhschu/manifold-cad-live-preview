import { defineConfig } from 'vite';

export default defineConfig({
  // Basic configuration for building the project
  // The CLI handles development servers automatically
  build: {
    target: 'esnext', // Support top-level await
    outDir: 'dist',
  },
  // Optimize deps configuration
  optimizeDeps: {
    exclude: ['manifold-3d'], // Exclude WASM module from pre-bundling
    esbuildOptions: {
      target: 'esnext' // Support top-level await in dependencies
    }
  },
  // Enable top-level await support
  esbuild: {
    target: 'esnext'
  }
});
