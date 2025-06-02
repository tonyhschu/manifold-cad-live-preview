import { defineConfig } from 'vite'

export default defineConfig({
  // Configure optimizeDeps to ensure proper handling of WASM modules
  optimizeDeps: {
    exclude: ['manifold-3d'],
  },
  // Set a different port
  server: {
    port: 5174, // Changed from default 5173
  },
  // Configure build to support top-level await
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        format: 'es'
      }
    }
  }
})
