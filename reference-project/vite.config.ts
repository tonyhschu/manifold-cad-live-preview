import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Source-based development - import configurator source directly to avoid npm link caching
  resolve: {
    alias: {
      '@manifold-studio/configurator': resolve(__dirname, '../packages/configurator/src'),
      '@manifold-studio/configurator/pipeline-runtime/types': resolve(__dirname, '../packages/configurator/src/pipeline-runtime/types.ts'),
      '@manifold-studio/typeface': resolve(__dirname, '../packages/typeface/src'),
    }
  },
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
  },
  // Development server configuration
  server: {
    cors: true,
    // Serve static assets
    fs: {
      allow: ['..', 'assets']
    }
  },
  // Public directory for static assets
  publicDir: 'assets'
});
