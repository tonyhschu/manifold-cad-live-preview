#!/usr/bin/env node
import { build } from 'vite';
import { resolve } from 'path';

console.log('Testing Vite pipeline compilation...');

try {
  // Test: Compile cube.ts as a library module
  const result = await build({
    configFile: false,
    build: {
      target: 'node18',
      lib: {
        entry: resolve('src/models/cube.ts'),
        name: 'CubeModel',
        fileName: 'cube',
        formats: ['es']
      },
      outDir: 'temp/pipeline',
      rollupOptions: {
        external: ['manifold-3d']
      }
    }
  });

  console.log('✅ Compilation successful!');
  console.log('Output should be in temp/pipeline/cube.js');
  
  // Try to import the compiled module
  const compiledPath = resolve('temp/pipeline/cube.js');
  console.log(`Attempting to import: ${compiledPath}`);
  
  const module = await import(`file://${compiledPath}`);
  console.log('✅ Module imported successfully!');
  console.log('Exports:', Object.keys(module));
  
  // Test if we can execute the model
  console.log('\nTesting model execution...');
  if (module.createCube) {
    console.log('Found createCube function');
    // Try to call it with default parameters
    const cube = module.createCube();
    console.log('✅ Model executed successfully!');
    console.log('Cube result:', typeof cube);
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error);
}
