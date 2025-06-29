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
  // Enable top-level await for Manifold WASM loading
  esbuild: {
    target: 'es2022'
  },
  optimizeDeps: {
    exclude: ['manifold-3d']
  },
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
      '@manifold-studio/configurator': resolve(__dirname, './node_modules/@manifold-studio/configurator/src'),
      '@manifold-studio/wrapper': resolve(__dirname, './node_modules/@manifold-studio/wrapper/src')
    }
  },
  // Build configuration
  build: {
    target: 'esnext', // Support top-level await
  },
  // Pass REPO_HMR flag to the browser
  define: {
    'import.meta.env.VITE_REPO_HMR': JSON.stringify(process.env.REPO_HMR === 'true')
  }
});
