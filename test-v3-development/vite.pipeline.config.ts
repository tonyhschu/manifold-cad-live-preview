import { defineConfig } from 'vite';
import { resolve } from 'path';
import { manifestGenerator } from './vite-plugins/manifest-generator';

export default defineConfig({
  // Pipeline Build Server configuration
  build: {
    // Build as a library that exports pipeline functions
    lib: {
      entry: './pipeline-entry.ts',
      name: 'ModelPipeline',
      fileName: 'pipeline',
      formats: ['es']
    },
    outDir: './temp',
    rollupOptions: {
      // External dependencies that should not be bundled
      external: ['manifold-3d'],
      // Bundle the wrapper since we need it in the pipeline
      output: {
        globals: {
          'manifold-3d': 'manifold'
        }
      }
    }
  },
  plugins: [
    // Generate manifest.json after each build
    manifestGenerator({
      command: 'npm run generate:manifest',
      verbose: true
    })
  ],
  server: {
    port: 3001,
  },
  // Resolve configuration for TypeScript
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
