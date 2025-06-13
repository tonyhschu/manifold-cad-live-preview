import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ManifoldConfigurator',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: ['@manifold-studio/wrapper', 'manifold-3d'],
      output: {
        globals: {
          '@manifold-studio/wrapper': 'ManifoldWrapper'
        }
      }
    },
    outDir: 'dist/lib',
    cssCodeSplit: false,
    cssMinify: true
  },
  esbuild: {
    target: 'es2022'
  }
});
