# Vitest Migration Plan

## Current Testing Architecture Issues

Our current testing setup has several architectural inconsistencies:

### 1. **Compilation Mismatch**
- **Browser Development**: Vite compiles TypeScript on-the-fly
- **Node.js Tests**: Pre-compiled JavaScript files via TypeScript compiler
- **Result**: Tests import from `dist/` while dev imports from `src/`

### 2. **Environment Confusion**
- Some tests need **Node.js environment** (pipeline, WASM loading)
- Some tests need **Browser environment** (DOM, Blob APIs)
- Current setup forces everything into Node.js with manual mocking

### 3. **Technical Debt**
- Tests depend on pre-compilation step (`npm run compile`)
- Inconsistent import paths (`../dist/types/parametric-config.js` vs `./src/types/parametric-config.ts`)
- Manual environment detection and mocking

## Test Analysis

### Pure Library Tests (Node.js Compatible)
```
tests/lib/export.test.js           ✅ Node.js friendly
tests/parametric-config.test.js    ✅ Node.js friendly  
tests/parameter-manager.test.js    ✅ Node.js friendly
tests/simple-service.test.js       ✅ Node.js friendly
tests/manifold-integration.test.js ✅ Node.js friendly (WASM)
```

### UI/Browser Tests (Need Browser Environment)
```
tests/ui/store.test.js             ⚠️  Currently mocked for Node.js
Future: Component tests             🔄 Will need browser environment
Future: DOM manipulation tests      🔄 Will need browser environment
```

## Recommended Migration Strategy

### Phase 1: Vitest with Dual Environment Support

Vitest supports both Node.js and browser environments through different test pools:

```javascript
// vitest.config.js
export default defineConfig({
  test: {
    // Default environment for most tests
    environment: 'node',
    
    // Browser environment for specific tests
    environmentMatchGlobs: [
      ['tests/ui/**', 'happy-dom'],           // UI tests in browser-like env
      ['tests/browser/**', 'happy-dom'],      // Future browser tests
      ['tests/components/**', 'happy-dom']    // Future component tests
    ]
  }
})
```

### Phase 2: Test Organization

Reorganize tests by environment needs:

```
tests/
├── lib/                    # Pure library tests (Node.js)
│   ├── export.test.ts
│   ├── parametric-config.test.ts
│   └── manifold-integration.test.ts
├── services/              # Service layer tests (Node.js)
│   ├── simple-service.test.ts
│   └── parameter-manager.test.ts
├── ui/                    # UI tests (Browser environment)
│   ├── store.test.ts
│   └── components/        # Future component tests
└── pipeline/              # Pipeline-specific tests (Node.js)
    └── export-pipeline.test.ts
```

### Phase 3: Import Path Consistency

All tests import directly from TypeScript sources:

```typescript
// Before (inconsistent)
const { P, createConfig } = await import('../dist/types/parametric-config.js');

// After (consistent with dev)
import { P, createConfig } from '../src/types/parametric-config.ts';
```

## Implementation Steps

### Step 1: Install Vitest
```bash
npm install --save-dev vitest happy-dom @vitest/ui
```

### Step 2: Create Vitest Config
```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    environmentMatchGlobs: [
      ['tests/ui/**', 'happy-dom'],
      ['tests/browser/**', 'happy-dom']
    ],
    // Use same resolve config as main Vite config
    alias: {
      '@': '/src'
    }
  },
  // Inherit from main Vite config for consistency
  extends: './vite.config.js'
})
```

### Step 3: Update Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:lib": "vitest run tests/lib/",
    "test:services": "vitest run tests/services/",
    "test:ui-layer": "vitest run tests/ui/",
    "test:pipeline": "vitest run tests/pipeline/"
  }
}
```

### Step 4: Migrate Tests One by One

**Priority Order:**
1. **`parametric-config.test.js`** → Direct TypeScript imports
2. **`parameter-manager.test.js`** → Remove compilation dependency  
3. **`lib/export.test.js`** → Already Node.js compatible
4. **`ui/store.test.js`** → Move to browser environment
5. **`manifold-integration.test.js`** → Keep in Node.js environment

### Step 5: Remove Compilation Dependency

Once migrated, tests no longer need pre-compilation:
- Remove `npm run compile &&` from test scripts
- Tests import directly from `src/`
- Vitest handles TypeScript compilation

## Benefits After Migration

### 🚀 **Development Experience**
- **Consistent imports**: Same paths in tests and dev
- **Fast feedback**: No compilation step needed
- **TypeScript support**: Direct `.ts` imports
- **Watch mode**: Tests re-run on file changes

### 🧪 **Testing Capabilities**
- **Environment separation**: Node.js vs Browser tests
- **Better mocking**: Vitest's built-in mocking system
- **Coverage**: Built-in coverage reporting
- **Debugging**: Better error messages and stack traces

### 🏗️ **Architecture Alignment**
- **Same compilation**: Vite handles both dev and test
- **Shared config**: Test config extends main Vite config
- **Future-ready**: Easy to add component tests, E2E tests

## Handling Dual Environment Needs

### Node.js Pipeline Tests
```typescript
// tests/pipeline/export-pipeline.test.ts
import { describe, it, expect } from 'vitest'
import { manifoldToOBJ } from '../../src/lib/export-core'

describe('Pipeline Export', () => {
  it('generates OBJ for Node.js pipeline', () => {
    // Test the pure function that pipeline uses
    const result = manifoldToOBJ(mockManifold)
    expect(result).toContain('v ')
  })
})
```

### Browser UI Tests
```typescript
// tests/ui/store.test.ts (runs in happy-dom)
import { describe, it, expect } from 'vitest'
import { exportToOBJ } from '../../src/lib/export'

describe('Browser Export', () => {
  it('generates Blob for browser download', () => {
    // Test the browser wrapper that creates Blob
    const blob = exportToOBJ(mockManifold)
    expect(blob).toBeInstanceOf(Blob)
  })
})
```

## Migration Timeline

- **Week 1**: Install Vitest, create config, migrate 1-2 simple tests
- **Week 2**: Migrate remaining tests, update scripts
- **Week 3**: Remove compilation dependency, cleanup
- **Future**: Add component tests, visual regression tests

## Risks & Mitigation

### Risk: WASM Loading in Tests
**Mitigation**: Keep manifold-integration test in Node.js environment, mock WASM for unit tests

### Risk: Breaking Existing Workflow  
**Mitigation**: Migrate incrementally, keep old scripts until migration complete

### Risk: Environment Configuration Complexity
**Mitigation**: Start simple (Node.js only), add browser environment gradually

## Success Criteria

✅ All tests pass without pre-compilation step
✅ Tests import directly from TypeScript sources  
✅ Browser and Node.js code paths both tested appropriately
✅ Test execution time improved (no compilation step)
✅ Developer experience improved (consistent imports, better errors)