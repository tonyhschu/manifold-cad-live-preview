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
  },
  // Pass REPO_HMR flag to the browser
  define: {
    'import.meta.env.VITE_REPO_HMR': JSON.stringify(process.env.REPO_HMR === 'true')
  }
});
