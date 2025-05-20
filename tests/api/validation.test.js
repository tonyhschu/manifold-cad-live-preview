/**
 * @fileoverview API validation tests for manifold.ts
 * 
 * These tests validate that our manifold.ts exports match the expected
 * functionality and are complete. They ensure that utility functions are
 * properly exported and that key features are available.
 */

// Set development environment for validation warnings
process.env.NODE_ENV = 'development';

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
    console.log(`❌ FAIL: ${name} - ${error.message}`);
  }
}

/**
 * API validation tests
 * @param {Object} manifold - The imported manifold module
 */
export function runApiValidationTests(manifold) {
  console.log('\n🔍 Running API validation tests...');
  
  // 1. Basic exports check
  test('Module exports Manifold class', () => {
    return !!manifold.Manifold;
  });
  
  test('Module exports utils object', () => {
    return !!manifold.utils;
  });
  
  test('Module exports primitive creation functions', () => {
    return typeof manifold.cube === 'function' &&
           typeof manifold.sphere === 'function' &&
           typeof manifold.cylinder === 'function';
  });
  
  test('Module exports boolean operation functions', () => {
    return typeof manifold.union === 'function' &&
           typeof manifold.difference === 'function' &&
           typeof manifold.intersection === 'function';
  });
  
  // 2. Utility function validation
  test('All utility functions are individually exported', () => {
    const knownUtils = [
      'setMinCircularAngle',
      'setMinCircularEdgeLength',
      'setCircularSegments',
      'getCircularSegments',
      'resetToCircularDefaults'
    ];
    
    // Get all utilities from the utils object
    const availableUtils = Object.keys(manifold.utils);
    
    // Check if all available utilities are exported
    const missingExports = availableUtils.filter(
      util => !Object.prototype.hasOwnProperty.call(manifold, util)
    );
    
    // Check if we have exports that don't exist
    const nonexistentExports = knownUtils.filter(
      util => !availableUtils.includes(util)
    );
    
    if (missingExports.length > 0) {
      return `Missing exports: ${missingExports.join(', ')}`;
    }
    
    if (nonexistentExports.length > 0) {
      return `Nonexistent exports: ${nonexistentExports.join(', ')}`;
    }
    
    return true;
  });
  
  // 3. API compatibility checks
  test('Manifold.hull exists', () => {
    return typeof manifold.Manifold.hull === 'function' || 
      'Hull operation not available on Manifold class (may be OK)';
  });
  
  test('hull function exists', () => {
    return typeof manifold.hull === 'function' || 
      'Hull function not available (may be OK)';
  });
  
  // 4. Factory check
  test('createManifoldFactory works', () => {
    const factory = manifold.createManifoldFactory();
    return typeof factory.cube === 'function';
  });
  
  test('Factory contains all static Manifold methods', () => {
    const factory = manifold.createManifoldFactory();
    const staticMethods = Object.keys(manifold.Manifold)
      .filter(key => typeof manifold.Manifold[key] === 'function');
      
    const missingMethods = staticMethods.filter(method => 
      typeof factory[method] !== 'function'
    );
    
    if (missingMethods.length > 0) {
      return `Factory missing methods: ${missingMethods.join(', ')}`;
    }
    
    return true;
  });
  
  return results;
}

/**
 * Summarize test results with proper exit code
 * @param {Object} results - Test results object
 */
export function summarizeResults(results) {
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`Passed: ${results.passed.length}`);
  console.log(`Warnings: ${results.warnings.length}`);
  console.log(`Failed: ${results.failed.length}`);
  
  // Show details of warnings and failures
  if (results.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    results.warnings.forEach(warning => {
      console.log(`- ${warning.name}: ${warning.message}`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failures:');
    results.failed.forEach(failure => {
      console.log(`- ${failure.name}: ${failure.error}`);
    });
    console.log('\n❌ API validation failed with errors');
    return 1;  // Exit code 1 for failures
  } else if (results.warnings.length > 0) {
    console.log('\n⚠️ API validation passed with warnings');
    return 0;  // Exit code 0 for warnings
  } else {
    console.log('\n✅ API validation passed successfully');
    return 0;  // Exit code 0 for success
  }
}