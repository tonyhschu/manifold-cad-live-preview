import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // UI Harness Server configuration
  server: {
    port: 5173,
    // Serve temp files directly (no proxy needed)
    fs: {
      allow: ['..', '.']
    }
  },
  // Resolve aliases for packages
  resolve: {
    alias: {
      '@manifold-studio/configurator': resolve(__dirname, '../packages/configurator'),
      '@manifold-studio/wrapper': resolve(__dirname, '../packages/wrapper')
    }
  },
  // Build configuration
  build: {
    target: 'esnext', // Support top-level await
    outDir: 'dist',
  },
  // Allow serving files from temp directory
  publicDir: false,
  // Optimize deps configuration
  optimizeDeps: {
    exclude: ['manifold-3d'], // Exclude WASM module from pre-bundling
    include: ['@manifold-studio/wrapper', '@manifold-studio/configurator'],
    esbuildOptions: {
      target: 'esnext' // Support top-level await in dependencies
    }
  },
  // Enable top-level await support
  esbuild: {
    target: 'esnext'
  },
});
