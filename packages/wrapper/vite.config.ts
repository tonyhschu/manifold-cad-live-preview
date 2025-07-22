/**
 * Vite Config for @manifold-studio/wrapper
 * 
 * Builds the wrapper package with proper ES module support,
 * TypeScript compilation, and dependency externalization.
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    target: 'node18',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ManifoldStudioWrapper',
      fileName: 'index',
      formats: ['es'] // ES modules only for now
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: [
        'manifold-3d',
        '@gltf-transform/core',
        'tweakpane',
        '@jscadui/3mf-export',
        'fflate'
      ],
      output: {
        // Preserve directory structure for better imports
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        // Ensure .js extensions in imports
        format: 'es'
      }
    },
    // Generate declaration files
    emptyOutDir: true,
    sourcemap: true
  },
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  // Ensure TypeScript declarations are generated
  plugins: [
    {
      name: 'typescript-declarations',
      buildEnd() {
        // TypeScript declarations will be handled by tsc in a separate step
      }
    }
  ]
});
