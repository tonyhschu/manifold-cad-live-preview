# Create-App Testing Guide

This document describes how to run and interpret the test suite for `@manifold-studio/create-app`.

## Overview

The testing infrastructure validates that the create-app package correctly generates working Manifold Studio projects. Tests are organized into several categories:

- **Template Generation**: Validates file structure and Handlebars processing
- **Package Validation**: Checks package.json structure and dependencies
- **Installation**: Tests npm install process and dependency resolution
- **Build System**: Validates that generated projects can build successfully

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Run specific test suites
npm run test:template
npm run test:package
npm run test:install
npm run test:build

# Run tests with verbose output
npm run test:verbose
```

## Test Categories

### Template Generation Tests
**File**: `tests/integration/template-generation.test.ts`
**Purpose**: Validates that project scaffolding works correctly

- ✅ Creates correct file structure
- ✅ Processes Handlebars templates properly
- ✅ Generates all required files
- ✅ Validates package.json and TypeScript configuration
- ✅ Tests error handling for invalid inputs

### Package Validation Tests
**File**: `tests/integration/package-validation.test.ts`
**Purpose**: Ensures generated package.json files are correct

- ✅ Dependency resolution and version compatibility
- ✅ Script definitions and validity
- ✅ Package metadata correctness
- ✅ Security vulnerability scanning

### Installation Tests
**File**: `tests/integration/installation.test.ts`
**Purpose**: Tests the npm install process for generated projects

- ✅ Fresh installation success
- ✅ All required dependencies installed
- ✅ Package lock file generation
- ✅ Installation performance and robustness
- ✅ Post-installation validation

### Build System Tests
**File**: `tests/integration/build-system.test.ts`
**Purpose**: Validates that generated projects can build successfully

- ✅ Pipeline build (`npm run build:pipeline`)
- ✅ UI build (`npm run build:ui`)
- ✅ Combined build (`npm run build`)
- ✅ TypeScript compilation without errors
- ✅ Build artifact validation
- ✅ Build performance monitoring

## Test Utilities

The test suite includes several utilities in `tests/utils/`:

- **TempDir**: Manages temporary directories for test projects
- **ProcessRunner**: Executes npm commands with proper error handling
- **FileValidator**: Validates file existence, content, and structure
- **ProjectCreator**: Creates test projects using the create-app CLI

## Running Tests Manually

### Prerequisites

1. Ensure you have Node.js 16+ and npm installed
2. Build the create-app package: `npm run build`
3. Install test dependencies: `npm install`

### Individual Test Suites

```bash
# Template generation only
npx vitest run tests/integration/template-generation.test.ts

# Package validation only
npx vitest run tests/integration/package-validation.test.ts

# Installation testing only
npx vitest run tests/integration/installation.test.ts

# Build system testing only
npx vitest run tests/integration/build-system.test.ts
```

### Test Configuration

Tests can be configured via environment variables:

```bash
# Increase timeouts for slow systems
export VITEST_TIMEOUT=600000  # 10 minutes

# Enable verbose logging
export DEBUG=1

# Skip slow tests
export SKIP_SLOW_TESTS=1
```

## Interpreting Test Results

### Success Indicators
- ✅ All tests pass
- No dependency conflicts during installation
- Build artifacts generated correctly
- No TypeScript compilation errors

### Common Failure Patterns

#### Template Generation Failures
- **Missing files**: Check template directory structure
- **Handlebars errors**: Validate template syntax
- **Invalid project names**: Ensure name validation works

#### Package Validation Failures
- **Dependency conflicts**: Check for version mismatches
- **Missing scripts**: Verify package.json template
- **Security vulnerabilities**: Update dependencies

#### Installation Failures
- **Network timeouts**: May need to retry or check npm registry
- **Permission errors**: Check file system permissions
- **Missing dependencies**: Verify package.json completeness

#### Build System Failures
- **TypeScript errors**: Check for type issues in templates
- **Missing artifacts**: Verify build script configuration
- **Performance issues**: Monitor build times

## Debugging Failed Tests

### Enable Verbose Logging
```bash
npm run test:verbose
```

### Run Single Test
```bash
npx vitest run --reporter=verbose tests/integration/template-generation.test.ts -t "should create project with correct file structure"
```

### Inspect Generated Projects
Tests create temporary projects that are cleaned up automatically. To inspect them:

1. Modify test to add a delay before cleanup
2. Or copy the temp directory path from test output
3. Navigate to the temp directory to inspect files

### Check Test Utilities
If tests are failing unexpectedly, verify the test utilities:

```bash
# Test ProcessRunner
node -e "import('./tests/utils/process-runner.js').then(m => m.ProcessRunner.getNpmVersion().then(console.log))"

# Test FileValidator
node -e "import('./tests/utils/file-validator.js').then(m => m.FileValidator.validate('./package.json').then(console.log))"
```

## Performance Monitoring

Tests include performance monitoring for:

- **Installation time**: Should complete within 5 minutes
- **Build time**: Should complete within 3 minutes
- **Template generation**: Should complete within 30 seconds

Performance warnings are logged but don't fail tests unless they exceed hard limits.

## Continuous Integration

When CI/CD is implemented, these tests will run automatically on:

- Pull requests
- Main branch commits
- Release preparation
- Scheduled nightly runs

The test suite is designed to be deterministic and should not have flaky failures.

## Contributing to Tests

When adding new features to create-app:

1. Add corresponding tests to validate the feature
2. Update this documentation
3. Ensure tests pass locally before submitting PR
4. Consider adding performance monitoring for new operations

### Test Writing Guidelines

- Use descriptive test names that explain what is being validated
- Include both positive and negative test cases
- Clean up resources (temp directories, processes) in finally blocks
- Use appropriate timeouts for different types of operations
- Log progress for long-running operations
- Validate both success conditions and error handling

## Troubleshooting

### Common Issues

**Tests timeout**: Increase timeout values or check system performance
**Permission denied**: Ensure proper file system permissions
**Network errors**: Check npm registry connectivity
**Memory issues**: Close other applications or increase Node.js memory limit

### Getting Help

If tests are failing and you can't determine the cause:

1. Check the test output for specific error messages
2. Run tests with verbose logging enabled
3. Verify your development environment meets requirements
4. Check for recent changes that might affect the create-app functionality
