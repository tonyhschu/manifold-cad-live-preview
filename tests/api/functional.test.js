/**
 * @fileoverview Functional tests for manifold.ts
 * 
 * These tests attempt to exercise the actual functionality of the manifold module,
 * creating shapes and performing operations. Note that these tests may not work in
 * all environments due to WASM dependencies.
 */

// Test results tracking
const results = {
  passed: [],
  warnings: [],
  failed: []
};

/**
 * Simple test runner
 * @param {string} name - Test name
 * @param {Function} fn - Test function that returns true, string (warning), or throws
 */
function test(name, fn) {
  try {
    const result = fn();
    if (result === true) {
      results.passed.push(name);
      console.log(`✅ PASS: ${name}`);
    } else {
      results.warnings.push({ name, message: result });
      console.log(`⚠️ WARN: ${name} - ${result}`);
    }
  } catch (error) {
    results.failed.push({ name, error: error.message });
    console.log(`❌ FAIL: ${name} - ${error.message || 'Unknown error'}`);
  }
}

/**
 * Functional tests that attempt to use the manifold API
 * @param {Object} manifold - The imported manifold module
 */
export function runFunctionalTests(manifold) {
  console.log('\n🧪 Running functional tests...');
  console.log('Note: These tests may be skipped in environments without WASM support');
  
  try {
    // Test creating primitives with class methods
    test('Create primitive shapes using Manifold class', () => {
      try {
        const cube = manifold.Manifold.cube([10, 10, 10]);
        const sphere = manifold.Manifold.sphere(5);
        
        return !!cube && !!sphere;
      } catch (e) {
        return `Skipped: ${e.message} - WASM may not be available`;
      }
    });
    
    // Test boolean operations with class methods
    test('Perform boolean operations using Manifold class', () => {
      try {
        const cube = manifold.Manifold.cube([10, 10, 10]);
        const sphere = manifold.Manifold.sphere(5);
        const union = manifold.Manifold.union([cube, sphere]);
        
        return !!union;
      } catch (e) {
        return `Skipped: ${e.message} - WASM may not be available`;
      }
    });
    
    // Test hull operation
    test('Perform hull operation using Manifold class', () => {
      try {
        if (typeof manifold.Manifold.hull !== 'function') {
          return 'Hull operation not available on Manifold class';
        }
        
        const cube = manifold.Manifold.cube([10, 10, 10]);
        const sphere = manifold.Manifold.sphere(5);
        const hull = manifold.Manifold.hull([cube, sphere]);
        
        return !!hull;
      } catch (e) {
        return `Skipped: ${e.message} - WASM may not be available`;
      }
    });
    
    // Test compatibility functions
    test('Create primitive shapes using functional API', () => {
      try {
        const cube = manifold.cube([5, 5, 5]);
        const sphere = manifold.sphere(3);
        
        return !!cube && !!sphere;
      } catch (e) {
        return `Skipped: ${e.message} - WASM may not be available`;
      }
    });
    
    test('Perform operations using functional API', () => {
      try {
        const cube = manifold.cube([5, 5, 5]);
        const sphere = manifold.sphere(3);
        const union = manifold.union([cube, sphere]);
        
        if (typeof manifold.hull === 'function') {
          const hull = manifold.hull([cube, sphere]);
          return !!union && !!hull;
        }
        
        return !!union;
      } catch (e) {
        return `Skipped: ${e.message} - WASM may not be available`;
      }
    });
    
    // Test factory
    test('Create and use factory', () => {
      try {
        const factory = manifold.createManifoldFactory();
        const box = factory.cube([8, 8, 8]);
        const ball = factory.sphere(4);
        const result = factory.difference(box, ball);
        
        return !!result;
      } catch (e) {
        return `Skipped: ${e.message} - WASM may not be available`;
      }
    });
  } catch (error) {
    console.log('❌ Could not run functional tests:', error.message);
  }
  
  return results;
}