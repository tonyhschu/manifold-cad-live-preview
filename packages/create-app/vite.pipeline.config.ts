import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Pipeline build configuration
  build: {
    target: 'esnext',
    outDir: 'temp',
    lib: {
      entry: resolve(__dirname, 'pipeline-entry.ts'),
      name: 'Pipeline',
      fileName: 'pipeline',
      formats: ['es']
    },
    rollupOptions: {
      external: ['manifold-3d'],
      output: {
        globals: {
          'manifold-3d': 'manifold'
        }
      }
    },
    // Don't minify for easier debugging
    minify: false,
    // Generate source maps for debugging
    sourcemap: true
  },
  // Resolve aliases for packages - SOURCE-BASED DEVELOPMENT
  resolve: {
    alias: {
      '@manifold-studio/wrapper': resolve(__dirname, '../wrapper/src')
    }
  },
  // Optimize deps configuration
  optimizeDeps: {
    exclude: ['manifold-3d']
  },
  // Enable top-level await support
  esbuild: {
    target: 'esnext'
  },
  plugins: [
    {
      name: 'generate-manifest',
      writeBundle() {
        // This will be called after the pipeline is built
        console.log('🔄 Generating manifest after pipeline build...');
      }
    }
  ]
});
