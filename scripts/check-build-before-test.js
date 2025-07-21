#!/usr/bin/env node

/**
 * Pre-test Build Check
 * 
 * Verifies that the project has been built before running tests.
 * This prevents confusing module resolution errors when tests try to import
 * from uncompiled TypeScript files.
 */

import { existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

/**
 * Critical files that must exist after build
 */
const REQUIRED_BUILD_FILES = [
  // Configurator CLI build
  'packages/configurator/dist/cli/index.js',
  // Configurator lib build  
  'packages/configurator/dist/lib/index.js',
  // Wrapper build
  'packages/wrapper/dist/index.js'
];

/**
 * Source files to check modification times against
 */
const SOURCE_FILES_TO_CHECK = [
  'packages/configurator/src/pipeline-compiler/index.ts',
  'packages/configurator/src/pipeline-compiler/file-discovery.ts',
  'packages/configurator/src/pipeline-compiler/model-compiler.ts',
  'packages/configurator/src/cli/index.ts'
];

function checkFileExists(filePath) {
  const fullPath = join(rootDir, filePath);
  if (!existsSync(fullPath)) {
    return { exists: false, path: fullPath };
  }
  return { exists: true, path: fullPath, mtime: statSync(fullPath).mtime };
}

async function checkBuildStatus() {
  console.log('🔍 Checking build status before running tests...\n');

  // Check if required build files exist
  const missingFiles = [];
  const buildFiles = [];

  for (const file of REQUIRED_BUILD_FILES) {
    const result = checkFileExists(file);
    if (!result.exists) {
      missingFiles.push(file);
    } else {
      buildFiles.push(result);
    }
  }

  if (missingFiles.length > 0) {
    console.error('❌ BUILD REQUIRED: Missing compiled files');
    console.error('\nMissing files:');
    missingFiles.forEach(file => console.error(`  - ${file}`));
    console.error('\n💡 Solution: Run the build command first:');
    console.error('   npm run build');
    console.error('\n   Then run tests again.');
    process.exit(1);
  }

  // Check if source files are newer than build files
  const sourceFiles = [];
  for (const file of SOURCE_FILES_TO_CHECK) {
    const result = checkFileExists(file);
    if (result.exists) {
      sourceFiles.push(result);
    }
  }

  if (sourceFiles.length > 0 && buildFiles.length > 0) {
    const newestSource = Math.max(...sourceFiles.map(f => f.mtime.getTime()));
    const oldestBuild = Math.min(...buildFiles.map(f => f.mtime.getTime()));

    if (newestSource > oldestBuild) {
      console.warn('⚠️  WARNING: Source files are newer than build files');
      console.warn('   Some source files have been modified since the last build.');
      console.warn('   Tests may fail or use outdated code.');
      console.warn('\n💡 Recommendation: Run the build command first:');
      console.warn('   npm run build');
      console.warn('\n   Or continue with potentially outdated build (press Ctrl+C to cancel)...\n');
      
      // Give user 3 seconds to cancel
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log('✅ Build check passed - all required files exist\n');
}

// Run the check
checkBuildStatus().catch(error => {
  console.error('❌ Build check failed:', error.message);
  process.exit(1);
});
