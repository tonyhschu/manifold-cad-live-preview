#!/usr/bin/env node

/**
 * Test Summary Script
 * 
 * Runs tests for all packages and provides a comprehensive summary
 * with aggregated results across the entire monorepo.
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// ANSI color codes for better output (disabled in CI environments)
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

// Detect if we're in a CI environment or if colors should be disabled
const isCI = process.env.CI === 'true' ||
             process.env.GITHUB_ACTIONS === 'true' ||
             process.env.JENKINS_URL ||
             process.env.BUILDKITE ||
             process.env.CIRCLECI ||
             !process.stdout.isTTY;

function colorize(text, color) {
  if (isCI) {
    return text; // No colors in CI
  }
  return `${colors[color]}${text}${colors.reset}`;
}

function runCommand(command, args, cwd = rootDir) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      // Show real-time output but suppress the spinner characters
      const cleanText = text.replace(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏⠀]/g, '');
      if (cleanText.trim()) {
        process.stdout.write(cleanText);
      }
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      // In CI environments, also show stderr in real-time
      if (isCI) {
        process.stderr.write(text);
      }
    });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

function parseTestResults(output) {
  // Extract test summary from vitest output
  const testFilesMatch = output.match(/Test Files\s+(\d+)\s+passed(?:\s+\|\s+(\d+)\s+skipped)?\s+\((\d+)\)/);
  const testsMatch = output.match(/Tests\s+(\d+)\s+passed(?:\s+\|\s+(\d+)\s+skipped)?\s+\((\d+)\)/);
  const durationMatch = output.match(/Duration\s+([\d.]+(?:ms|s))/);

  return {
    files: {
      passed: testFilesMatch ? parseInt(testFilesMatch[1]) : 0,
      skipped: testFilesMatch ? parseInt(testFilesMatch[2] || '0') : 0,
      total: testFilesMatch ? parseInt(testFilesMatch[3]) : 0
    },
    tests: {
      passed: testsMatch ? parseInt(testsMatch[1]) : 0,
      skipped: testsMatch ? parseInt(testsMatch[2] || '0') : 0,
      total: testsMatch ? parseInt(testsMatch[3]) : 0
    },
    duration: durationMatch ? durationMatch[1] : 'unknown'
  };
}

async function runAllTests() {
  console.log(colorize('🧪 Running All Tests - Manifold Studio', 'bold'));
  console.log(colorize('=' .repeat(50), 'cyan'));
  console.log();

  const packages = [
    { name: 'Wrapper', command: 'npm run test:wrapper' },
    { name: 'Configurator', command: 'npm run test:configurator' },
    { name: 'Create-App', command: 'npm run test:create-app' }
  ];

  const results = [];
  let totalFiles = { passed: 0, skipped: 0, total: 0 };
  let totalTests = { passed: 0, skipped: 0, total: 0 };

  for (const pkg of packages) {
    console.log(colorize(`\n📦 ${pkg.name} Package Tests`, 'blue'));
    console.log(colorize('-'.repeat(30), 'cyan'));
    
    try {
      const result = await runCommand('npm', ['run', `test:${pkg.name.toLowerCase()}`]);
      
      if (result.code === 0) {
        const parsed = parseTestResults(result.stdout);
        results.push({ 
          package: pkg.name, 
          success: true, 
          ...parsed 
        });

        // Aggregate totals
        totalFiles.passed += parsed.files.passed;
        totalFiles.skipped += parsed.files.skipped;
        totalFiles.total += parsed.files.total;
        totalTests.passed += parsed.tests.passed;
        totalTests.skipped += parsed.tests.skipped;
        totalTests.total += parsed.tests.total;

        console.log(colorize(`✅ ${pkg.name} tests passed`, 'green'));
      } else {
        results.push({
          package: pkg.name,
          success: false,
          error: result.stderr || 'Unknown error',
          exitCode: result.code
        });
        console.log(colorize(`❌ ${pkg.name} tests failed (exit code: ${result.code})`, 'red'));
        if (result.stderr && !isCI) {
          console.error(colorize('Error output:', 'red'));
          console.error(result.stderr);
        }
      }
    } catch (error) {
      results.push({
        package: pkg.name,
        success: false,
        error: error.message
      });
      console.log(colorize(`❌ ${pkg.name} tests failed: ${error.message}`, 'red'));
    }
  }

  // Print comprehensive summary
  console.log(colorize('\n🎯 Test Results Summary', 'bold'));
  console.log(colorize('=' .repeat(50), 'cyan'));
  
  results.forEach(result => {
    if (result.success) {
      console.log(colorize(`✅ ${result.package}:`, 'green'));
      console.log(`   Files: ${result.files.passed} passed${result.files.skipped > 0 ? `, ${result.files.skipped} skipped` : ''} (${result.files.total} total)`);
      console.log(`   Tests: ${result.tests.passed} passed${result.tests.skipped > 0 ? `, ${result.tests.skipped} skipped` : ''} (${result.tests.total} total)`);
      console.log(`   Duration: ${result.duration}`);
    } else {
      console.log(colorize(`❌ ${result.package}: FAILED`, 'red'));
      if (result.exitCode) {
        console.log(`   Exit code: ${result.exitCode}`);
      }
      if (result.error && result.error !== 'Unknown error') {
        console.log(`   Error: ${result.error}`);
      }
    }
    console.log();
  });

  // Overall totals
  console.log(colorize('📊 Overall Totals:', 'bold'));
  console.log(colorize('-'.repeat(20), 'cyan'));
  console.log(`${colorize('Test Files:', 'bold')} ${colorize(totalFiles.passed, 'green')} passed${totalFiles.skipped > 0 ? `, ${colorize(totalFiles.skipped, 'yellow')} skipped` : ''} (${totalFiles.total} total)`);
  console.log(`${colorize('Tests:', 'bold')} ${colorize(totalTests.passed, 'green')} passed${totalTests.skipped > 0 ? `, ${colorize(totalTests.skipped, 'yellow')} skipped` : ''} (${totalTests.total} total)`);

  const allPassed = results.every(r => r.success);
  if (allPassed) {
    console.log(colorize('\n🎉 All tests passed!', 'green'));
    process.exit(0);
  } else {
    console.log(colorize('\n💥 Some tests failed!', 'red'));
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error(colorize(`❌ Test runner failed: ${error.message}`, 'red'));
  process.exit(1);
});
