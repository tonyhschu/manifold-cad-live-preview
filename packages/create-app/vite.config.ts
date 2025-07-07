import { defineConfig } from 'vite';
import { resolve } from 'path';
import { pipelineHMR } from './vite-plugins/pipeline-hmr';

export default defineConfig({
  // Plugins
  plugins: [
    pipelineHMR({
      watchFiles: ['temp/pipeline.js', 'temp/manifest.json']
    })
  ],
  // UI Server configuration
  server: {
    port: 5173,
    open: true,
    // Serve temp files directly (no proxy needed)
    fs: {
      allow: ['..', '.', '../..', '../../..']
    }
  },
  // Resolve aliases for packages - SOURCE-BASED DEVELOPMENT
  // Point directly to source files to avoid build chain complexity
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // SOURCE-BASED DEVELOPMENT: Point to source files directly
      // TODO: Update paths when packages are published and installed via npm
      '@manifold-studio/configurator': resolve(__dirname, '../configurator/src'),
      '@manifold-studio/wrapper': resolve(__dirname, '../wrapper/src')
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
    // Remove package includes since we're using source-based development
    // Vite will handle TypeScript compilation directly from source
    esbuildOptions: {
      target: 'esnext' // Support top-level await in dependencies
    }
  },
  // Enable top-level await support
  esbuild: {
    target: 'esnext'
  }
});
