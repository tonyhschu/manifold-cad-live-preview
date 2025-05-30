import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Default environment for most tests (library, services, manifold)
    environment: 'node',
    
    // Browser environment for specific UI tests
    environmentMatchGlobs: [
      ['tests/ui/**', 'happy-dom'],           // UI tests in browser-like env
      ['tests/browser/**', 'happy-dom'],      // Future browser tests
      ['tests/components/**', 'happy-dom']    // Future component tests
    ],
    
    // Use same resolve config as main Vite config for consistency
    alias: {
      '@': '/src'
    }
  },
  
  // Inherit optimizeDeps from main Vite config for consistency
  optimizeDeps: {
    exclude: ['manifold-3d'],
  },
})
