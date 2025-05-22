# Testing Guide

## Overview

With the new service architecture, we now have comprehensive testing capabilities that separate concerns and enable clean library extraction. Tests are organized by layer and responsibility.

## Test Structure

```
tests/
├── lib/                    # Pure library tests (future NPM package)
│   └── export.test.js     # Test OBJ export functions
├── services/              # Service layer tests (with mocks)
│   ├── UrlService.test.js
│   └── ExportService.test.js
├── ui/                    # UI tests (with service mocks)
│   └── store.test.js
└── manifold-integration.test.js  # Existing integration test
```

## Running Tests

### All Tests
```bash
npm test                    # Compile and run all tests
npm run test:skip-compile   # Run all tests without compiling
```

### By Layer
```bash
npm run test:lib           # Library tests only (pure functions)
npm run test:services      # Service layer tests (with mocks)
npm run test:ui           # UI tests (with service mocks)
npm run test:integration  # Integration tests
```

### Development
```bash
npm run test:watch        # Watch mode for development
```

## What Each Test Layer Validates

### 📦 Library Tests (`tests/lib/`)
**Purpose**: Test pure library functions that will be extracted to NPM package
- ✅ **No browser dependencies** - can run in Node.js
- ✅ **Export functions** - OBJ/GLB generation
- ✅ **Manifold operations** - shapes, unions, differences
- ✅ **Model creation** - individual model files

**Example**: `export.test.js`
```javascript
// Tests pure export function
const cube = manifoldModule.Manifold.cube([10, 10, 10]);
const blob = exportModule.exportToOBJ(cube);
assert.ok(blob instanceof Blob, 'Returns a Blob object');
```

### 🔧 Service Tests (`tests/services/`)
**Purpose**: Test business logic with dependency injection
- ✅ **Service interfaces** - verify contracts are met
- ✅ **Dependency mocking** - test in isolation
- ✅ **Error handling** - edge cases and failures
- ✅ **Progress tracking** - callback mechanisms

**Example**: `ExportService.test.js`
```javascript
// Tests service with mocked URL service
const mockUrlService = createMockUrlService();
const exportService = new ExportService(mockUrlService);
const formats = exportService.getSupportedFormats();
assert.ok(formats.find(f => f.id === 'obj'), 'Supports OBJ');
```

### 🎨 UI Tests (`tests/ui/`)
**Purpose**: Test UI components with mocked services
- ✅ **State management** - Preact Signals behavior
- ✅ **Component rendering** - Web Component lifecycle
- ✅ **Event handling** - user interactions
- ✅ **Service integration** - UI calls services correctly

**Example**: `store.test.js`
```javascript
// Tests store with mocked ModelService
const mockModelService = { loadModel: async () => ({ model: {}, exports: {} }) };
const result = await storeModule.loadModel('test');
assert.strictEqual(storeModule.currentModelId.value, 'test');
```

### 🔄 Integration Tests
**Purpose**: Test real system behavior end-to-end
- ✅ **WASM module loading** - manifold-3d integration
- ✅ **Full workflows** - complete model loading pipeline
- ✅ **Real dependencies** - actual library functions

## Benefits of This Architecture

### 🚀 **For Library Extraction**
- Library tests are **already isolated** and can move to NPM package
- Services tests verify **clean boundaries** between library and UI
- UI tests ensure **interface contracts** are maintained

### 🧪 **For Development**
- **Fast feedback** - most tests run without browser/WASM
- **Focused testing** - test one layer at a time
- **Mock-friendly** - easy to test edge cases

### 🛡️ **For Reliability**
- **Comprehensive coverage** - from pure functions to full workflows
- **Error scenarios** - test failures and edge cases
- **Regression prevention** - catch breaking changes early

## Test Examples

### Library Test (Pure Function)
```javascript
await t.test('exportToOBJ creates valid blob', async () => {
  const cube = manifoldModule.Manifold.cube([10, 10, 10]);
  const blob = exportModule.exportToOBJ(cube);
  
  assert.ok(blob instanceof Blob, 'Returns a Blob object');
  assert.strictEqual(blob.type, 'model/obj', 'Has correct MIME type');
});
```

### Service Test (With Mocks)
```javascript
await t.test('progress tracking calls callback', async () => {
  const progressCalls = [];
  const progressCallback = (progress, message) => {
    progressCalls.push({ progress, message });
  };
  
  await exportService.exportModel(mockModel, 'obj', 'test.obj', progressCallback);
  assert.ok(progressCalls.length > 0, 'Progress callback was called');
});
```

### UI Test (Component Behavior)
```javascript
await t.test('loadModel updates state correctly', async () => {
  const result = await storeModule.loadModel('test-model');
  
  assert.strictEqual(storeModule.currentModelId.value, 'test-model');
  assert.ok(storeModule.isModelLoaded.value, 'Model is loaded');
  assert.ok(!storeModule.isModelLoading.value, 'Not loading anymore');
});
```

## Running in CI/CD

The tests are designed to run in automated environments:

```bash
# In CI pipeline
npm run compile    # Build TypeScript
npm run test:lib   # Test pure library (fastest)
npm run test:services  # Test business logic
npm run test:ui    # Test UI layer
npm run test:integration  # Full integration (slowest)
```

## Next Steps

1. **Add more model tests** - test individual model creation functions
2. **Component tests** - test Web Components with JSDOM
3. **Visual regression tests** - screenshot comparisons
4. **Performance tests** - benchmark export operations
5. **E2E tests** - Playwright for browser automation

This testing architecture prepares us perfectly for library extraction while ensuring code quality and preventing regressions!