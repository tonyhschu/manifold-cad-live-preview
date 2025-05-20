/**
 * @fileoverview Main API test runner
 * 
 * This file serves as the entry point for running API validation tests.
 * It imports the manifold module and runs all tests, then summarizes the results.
 */

import { runApiValidationTests, summarizeResults } from './validation.test.js';
import { runFunctionalTests } from './functional.test.js';

/**
 * Merge multiple test results
 */
function mergeResults(...resultsList) {
  return {
    passed: resultsList.flatMap(r => r.passed),
    warnings: resultsList.flatMap(r => r.warnings),
    failed: resultsList.flatMap(r => r.failed)
  };
}

async function runTests() {
  try {
    console.log('🧪 Starting API tests');
    
    // Import the manifold module
    const manifold = await import('../../src/lib/manifold.js');
    
    // Run validation tests
    const validationResults = runApiValidationTests(manifold);
    
    // Run functional tests
    const functionalResults = runFunctionalTests(manifold);
    
    // Merge results
    const mergedResults = mergeResults(validationResults, functionalResults);
    
    // Summarize results and get exit code
    const exitCode = summarizeResults(mergedResults);
    
    // Exit with appropriate code
    process.exit(exitCode);
  } catch (error) {
    console.error('❌ Error running tests:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests();