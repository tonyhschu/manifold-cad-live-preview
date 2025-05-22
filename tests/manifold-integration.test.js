// tests/manifold-integration.test.js
// Integration test for manifold.ts
// This test verifies that the module exports match the actual WASM module

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directories
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distFile = path.join(projectRoot, 'dist/lib/manifold.js');

// Skip all tests if the compiled file doesn't exist
const skipAllTests = !fs.existsSync(distFile);

test('manifold.ts correctly exports all WASM module features', async (t) => {
  // Skip all tests if the compiled file doesn't exist
  if (skipAllTests) {
    console.error(`
❌ ERROR: Compiled file not found: ${distFile}
   Please run 'npm run compile' first to compile the TypeScript file.
   
   The test requires a compiled version of manifold.ts to run properly.
   This keeps the compiled file in the dist directory instead of the src directory.
`);
    return t.skip('Compiled file not found');
  }
  
  let manifoldModule;
  let rawModule;
  
  await t.test('can import and initialize the module', async () => {
    try {
      console.log('Importing manifold.ts module...');
      // This import will trigger the top-level await
      manifoldModule = await import('../dist/lib/manifold.js');
      console.log('Module imported successfully');
      assert.ok(manifoldModule, 'Module was imported');
    } catch (error) {
      console.error('Failed to import module:', error);
      throw error;
    }
  });
  
  // Skip the rest of the tests if module import failed
  if (!manifoldModule) {
    console.error('Skipping remaining tests due to module import failure');
    return;
  }
  
  await t.test('can access raw WASM module', async () => {
    rawModule = manifoldModule.getModule();
    assert.ok(rawModule, 'Raw WASM module is accessible');
  });
  
  await t.test('exports all Manifold class methods', async () => {
    const rawManifold = rawModule.Manifold;
    
    assert.ok(manifoldModule.Manifold, 'Manifold class is exported');
    assert.ok(rawManifold, 'Raw module has Manifold class');
    
    // Get methods from raw Manifold (static methods)
    const rawMethods = Object.getOwnPropertyNames(rawManifold)
      .filter(name => typeof rawManifold[name] === 'function');
    
    console.log('Raw Manifold methods:', rawMethods);
    
    // Check that all raw methods are available on exported Manifold
    for (const method of rawMethods) {
      assert.strictEqual(
        typeof manifoldModule.Manifold[method], 
        'function', 
        `Manifold.${method} is exported`
      );
    }
  });
  
  await t.test('exports essential utility functions', async () => {
    // Define the essential utility functions we want to expose
    const essentialUtils = [
      'setMinCircularAngle',
      'setMinCircularEdgeLength', 
      'setCircularSegments', 
      'getCircularSegments',
      'resetToCircularDefaults'
    ];
    
    // Find utility functions in raw module
    const rawUtilFunctions = Object.entries(rawModule)
      .filter(([key, value]) => 
        typeof value === 'function' && 
        !['Manifold', 'CrossSection', 'setup'].includes(key))
      .map(([key]) => key);
    
    console.log('Raw utility functions:', rawUtilFunctions);
    
    // Check that essential utility functions are directly exported (transparent access)
    for (const funcName of essentialUtils) {
      assert.strictEqual(
        typeof manifoldModule[funcName], 
        'function', 
        `${funcName} is directly exported`
      );
    }
  });
  
  await t.test('exports Manifold and CrossSection classes transparently', async () => {
    // Test that classes are exported
    assert.strictEqual(typeof manifoldModule.Manifold, 'function', 'Manifold class is exported');
    assert.strictEqual(typeof manifoldModule.CrossSection, 'function', 'CrossSection class is exported');
    
    // Test that primitive functions are accessible on Manifold class
    const primitiveFunctions = ['cube', 'cylinder', 'sphere'];
    for (const func of primitiveFunctions) {
      assert.strictEqual(
        typeof manifoldModule.Manifold[func], 
        'function', 
        `Manifold.${func} method exists`
      );
    }
    
    // Test that they actually work by creating simple shapes
    const testCube = manifoldModule.Manifold.cube([5, 5, 5]);
    assert.ok(testCube, 'Manifold.cube creates an object');
    assert.strictEqual(typeof testCube.getMesh, 'function', 'cube result has getMesh method');
    
    const testSphere = manifoldModule.Manifold.sphere(3);
    assert.ok(testSphere, 'Manifold.sphere creates an object');
    assert.strictEqual(typeof testSphere.getMesh, 'function', 'sphere result has getMesh method');
  });
  
  await t.test('Manifold class has boolean operation methods', async () => {
    const booleanOps = ['union', 'difference', 'intersection', 'hull'];
    
    // Test boolean operation methods on Manifold class
    for (const func of booleanOps) {
      assert.strictEqual(
        typeof manifoldModule.Manifold[func], 
        'function', 
        `Manifold.${func} method exists`
      );
    }
    
    // Test that they work
    const cube1 = manifoldModule.Manifold.cube([5, 5, 5]);
    const cube2 = manifoldModule.Manifold.cube([3, 3, 3]);
    const unionResult = manifoldModule.Manifold.union([cube1, cube2]);
    assert.ok(unionResult, 'Manifold.union operation works');
    assert.strictEqual(typeof unionResult.getMesh, 'function', 'union result has getMesh method');
  });
  
  await t.test('provides transparent access to original API', async () => {
    // Test that we can access the raw module for advanced operations
    assert.strictEqual(typeof manifoldModule.getModule, 'function', 'getModule function is exported');
    
    const rawModule = manifoldModule.getModule();
    assert.ok(rawModule, 'Raw module is accessible');
    assert.strictEqual(typeof rawModule.Manifold, 'function', 'Raw module has Manifold class');
    
    // Test that the exported Manifold is the same as the raw module's Manifold (transparent!)
    assert.strictEqual(manifoldModule.Manifold, rawModule.Manifold, 'Exported Manifold is same as raw module Manifold');
    assert.strictEqual(manifoldModule.CrossSection, rawModule.CrossSection, 'Exported CrossSection is same as raw module CrossSection');
    
    // Test that all expected Manifold static methods exist
    const expectedMethods = ['cube', 'sphere', 'cylinder', 'union', 'difference', 'intersection', 'hull'];
    for (const method of expectedMethods) {
      assert.strictEqual(
        typeof manifoldModule.Manifold[method], 
        'function', 
        `Manifold.${method} method exists`
      );
    }
  });
});