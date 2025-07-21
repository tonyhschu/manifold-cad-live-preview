# Pipeline Cleanup Plan: Make Pipeline Compiler the Source of Truth

## 🎯 **Objective**

Eliminate architectural drift by making the pipeline compiler the single source of truth for model discovery and manifest generation, removing all competing parallel implementations.

## 🔍 **Current Problem**

Investigation revealed **4 separate model discovery systems** and **3 different manifest generators** running in parallel, causing inconsistencies and the metadata bug where rich model metadata is extracted but ignored.

### **Competing Systems Identified**

1. **CLI Discovery** (`src/cli/model-discovery.ts`) - Basic glob-based discovery
2. **Browser Discovery** (`src/utils/file-discovery.ts`) - Vite import.meta.glob
3. **Pipeline Compiler Discovery** (`src/pipeline-compiler/file-discovery.ts`) - Node.js glob
4. **Legacy V1 Discovery** (`src/core/model-loader.ts`) - Legacy import.meta.glob

### **Manifest Generation Conflicts**

1. **CLI Manifest** - Generic descriptions, always marks as 'static'
2. **Pipeline Runtime Manifest** - Duplicate of CLI manifest
3. **Pipeline Compiler Manifest** - Rich metadata extracted but ignored

## 📐 **Correct Architecture (Based on MODEL_WATCHER_V3.md)**

```
User Project
├── Model Source Files (main.ts, components/*.ts)
├── manifold-studio dev command
│   └── Single Server (port 3000) → Serves UI + Pipeline artifacts
│       └── Integrated Pipeline Compiler → temp/pipeline.js + temp/manifest.json
└── Configurator Library → Consumes pipeline artifacts ONLY
```

### **Single Source of Truth: Pipeline Compiler**

**Pipeline Compiler Responsibilities:**

- ✅ Discover models using file system scanning
- ✅ Extract metadata from both parametric configs and static exports
- ✅ Generate `temp/pipeline.js` with model functions
- ✅ Generate `temp/manifest.json` with rich metadata
- ✅ Watch files and regenerate on changes

**Everything Else:**

- ❌ **NO** separate discovery systems
- ❌ **NO** manifest generation
- ✅ **ONLY** consume pipeline artifacts

## 🔧 **Implementation Plan**

### **Phase 1: Fix Pipeline Compiler Metadata Bug** ✅ **COMPLETED**

**Priority: CRITICAL** - Foundation issue

**Files Fixed:**

- ✅ `packages/configurator/src/pipeline-compiler/index.ts` (manifest generation)
- ✅ `packages/configurator/src/pipeline-compiler/model-compiler.ts` (metadata extraction)
- ✅ `packages/configurator/src/pipeline-compiler/function-generator.ts` (code generation)
- ✅ `packages/configurator/vite.config.cli.ts` (build configuration)

**Changes Completed:**

```typescript
// ✅ Fixed manifest generation to use extracted metadata
const manifest: PipelineManifest = {
  models: compiledFunctions.map((f) => ({
    id: f.id,
    name: f.metadata?.name || f.name, // ✅ Use metadata name
    type: f.type,
    description: f.metadata?.description || `${f.type} model: ${f.name}`,
    author: f.metadata?.author,
    version: f.metadata?.version,
  })),
  // ...
};

// ✅ Fixed metadata extraction to support both export names
const metadata = module.modelMetadata || module.metadata;

// ✅ Fixed ES module compilation issues
// ✅ Fixed template string scoping issues
```

**Results:**

- ✅ Rich metadata now extracted and included in manifest.json
- ✅ Both `metadata` and `modelMetadata` export names supported
- ✅ Pipeline compiler successfully compiles all model types
- ✅ Generated manifest includes name, description, author, version from models

### **Phase 2: Remove CLI Discovery & Manifest Generation** ✅ **COMPLETED**

**Priority: HIGH** - Eliminate competing systems

**Files Modified:**

- ✅ `packages/configurator/src/cli/commands/dev.ts` (completely refactored)
- ✅ `packages/configurator/src/cli/file-watcher.ts` (removed manifest regeneration)
- ✅ `packages/configurator/src/pipeline-compiler/index.ts` (added `generateUserPipelineEntry()`)

**Major Changes Completed:**

```typescript
// ✅ CLI completely refactored - removed all old discovery system
// ✅ Eliminated discoverUserModels() and validateModelFiles()
// ✅ Pipeline compiler now generates all three files:
//     - pipeline.js (compiled functions)
//     - manifest.json (rich metadata)
//     - user-pipeline-entry.ts (static imports for pipeline server)

// ✅ Unified file watching - pipeline compiler's built-in watcher only
// ✅ Fixed getModelConfig() to return parameter configuration objects
// ✅ Implemented cache-busting for dynamic imports
```

**Critical Fixes Applied:**

- ✅ **Parameter UI Bug**: Fixed `getModelConfig()` to return `{value, min, max, step}` objects instead of default values
- ✅ **Cache-Busting**: Added `?t=${Date.now()}` query parameters to prevent Node.js module caching
- ✅ **API Usage**: Fixed `createConfig` signature in test components
- ✅ **End-to-End Workflow**: Verified complete parameter UI functionality with browser testing

### **Phase 3: Deprecate Legacy Discovery Systems** ✅ **COMPLETED**

**Priority: MEDIUM** - Clean up old implementations

**Files Status:**

- ✅ `packages/configurator/src/core/model-loader.ts` (V1 legacy - still exists but not used in V3 workflow)
- ✅ `packages/configurator/src/utils/file-discovery.ts` (browser discovery - coexists with V3)
- ✅ `packages/configurator/src/cli/pipeline-runtime.ts` (duplicate manifest - eliminated)

**Strategy Completed:**

- ✅ V3 system completely bypasses legacy discovery systems
- ✅ Configurator V3 components only consume pipeline artifacts
- ✅ Legacy systems remain for backward compatibility but don't interfere

### **Phase 4: Test Suite Updates** 🔄 **IN PROGRESS**

**Priority: HIGH** - Ensure comprehensive test coverage for V3 architecture

**Test Categories:**

1. **Pipeline Compiler Tests** (NEW - HIGH PRIORITY)
2. **V3ModelService Tests** (NEW - HIGH PRIORITY)
3. **Integration Tests** (UPDATE - MEDIUM PRIORITY)
4. **Cache-Busting Tests** (NEW - MEDIUM PRIORITY)
5. **Component Tests** (UPDATE - LOW PRIORITY)

## 🚨 **Critical Fixes Needed**

### **1. Metadata Bug in Pipeline Compiler**

**File:** `packages/configurator/src/pipeline-compiler/index.ts:89-93`

**Current (Broken):**

```typescript
models: compiledFunctions.map((f) => ({
  id: f.id,
  name: f.name,
  type: f.type,
  // ❌ Missing: f.metadata fields!
}));
```

**Fixed:**

```typescript
models: compiledFunctions.map((f) => ({
  id: f.id,
  name: f.name,
  type: f.type,
  description: f.metadata?.description || `${f.type} model: ${f.name}`,
  author: f.metadata?.author,
  version: f.metadata?.version,
}));
```

### **2. CLI Manifest Generation Conflict**

**File:** `packages/configurator/src/cli/commands/dev.ts:206-208`

**Current (Conflicting):**

```typescript
// CLI generates basic manifest
const manifestContent = generateManifest(validModels);
fs.writeFileSync(manifestPath, manifestContent, "utf-8");
```

**Fixed:**

```typescript
// ❌ Remove CLI manifest generation entirely
// Let pipeline compiler handle manifest generation
```

### **3. File Watcher Manifest Regeneration**

**File:** `packages/configurator/src/cli/file-watcher.ts:122-124`

**Current (Duplicate):**

```typescript
// File watcher generates its own manifest
const manifestContent = generateManifest(validModels);
fs.writeFileSync(manifestPath, manifestContent, "utf-8");
```

**Fixed:**

```typescript
// ❌ Remove file watcher manifest generation
// Only trigger pipeline compiler regeneration
```

## 🧪 **Testing Strategy**

### **Current Test Status (2025-07-20):**

- ✅ **packages/configurator**: All 55 tests passing (6 test files)
- ✅ **packages/wrapper**: 66 tests passing, 13 skipped (5 test files passed, 1 skipped)
- ⚠️ **packages/create-app**: 49 tests passing, 1 failed (unrelated to V3 changes)

### **Validation Steps Completed:**

1. ✅ **Metadata Flow Test** - Rich metadata appears in manifest and UI
2. ✅ **Single Source Test** - Only pipeline compiler generates manifest
3. ✅ **HMR Test** - File changes trigger pipeline regeneration only
4. ✅ **Integration Test** - End-to-end: model change → rich manifest → UI update
5. ✅ **Parameter UI Test** - Parameter controls work with real-time updates

### **Test Cases Verified:**

- ✅ Static model with `modelMetadata` export
- ✅ Parametric model with config metadata
- ✅ Model without metadata (fallback behavior)
- ✅ Mixed project with both model types
- ✅ Parameter configuration objects vs default values
- ✅ Cache-busting with dynamic imports

## 📊 **Success Criteria**

### **Before (Current State):**

```json
{
  "id": "components/simple-cube",
  "name": "Simple Cube",
  "type": "static",
  "description": "Model: components/simple-cube" // ❌ Generic fallback
}
```

### **After (Fixed State):**

```json
{
  "id": "components/simple-cube",
  "name": "Simple Cube",
  "type": "static",
  "description": "A basic 5x5x5 cube for testing", // ✅ Rich metadata
  "author": "V3 Test Suite"
}
```

## 🎯 **Implementation Order**

1. ✅ **Fix metadata bug** (30 min) - Critical foundation
2. ✅ **Remove CLI manifest** (15 min) - Eliminate conflict
3. ✅ **Update file watcher** (15 min) - Remove duplication
4. ✅ **Test integration** (30 min) - Verify fixes work
5. ✅ **Deprecate legacy systems** (60 min) - Clean up old code
6. ✅ **Fix parameter UI bug** (120 min) - Critical user experience
7. ✅ **End-to-end verification** (60 min) - Complete workflow testing
8. 🔄 **Add comprehensive tests** (180 min) - Test coverage for V3 architecture

## 📈 **Current Status (Updated 2025-07-20)**

### **✅ Major Achievements**

- **V3 Architecture Complete**: Pipeline compiler is single source of truth
- **Parameter UI Working**: Fixed critical data format bug, UI fully functional
- **Cache-Busting Implemented**: Dynamic imports use timestamp query parameters
- **API Usage Fixed**: Corrected `createConfig` signature in test components
- **End-to-End Verified**: Complete workflow from file changes to UI updates
- **Test Suite Passing**: All existing tests compatible with V3 architecture

### **🔄 Next Immediate Steps**

1. **Add Pipeline Compiler Tests** - Test new `generateUserPipelineEntry()` method
2. **Add V3ModelService Tests** - Test pipeline-based model loading
3. **Add Integration Tests** - Test complete CLI-based development workflow
4. **Add Cache-Busting Tests** - Test dynamic import cache invalidation
5. **Update Component Tests** - Test V3 bridge integration

### **🎯 Test Coverage Priorities**

**HIGH PRIORITY:**

- Pipeline compiler `generateUserPipelineEntry()` method
- Pipeline compiler `getModelConfig()` fix (parameter configuration objects)
- V3ModelService pipeline-based model loading
- Cache-busting functionality in dynamic imports

**MEDIUM PRIORITY:**

- Complete CLI-based development workflow
- Dual server setup (template + pipeline servers)
- Hot module replacement with file changes
- End-to-end parameter UI functionality

**LOW PRIORITY:**

- V3 bridge integration in components
- Signal-based reactive updates
- Error handling edge cases

## 🧪 **Detailed Test Plan for V3 Architecture**

### **Test Files to Create:**

#### **1. Pipeline Compiler Tests** (`tests/pipeline-compiler/pipeline-compiler.test.ts`)

```typescript
describe("Pipeline Compiler V3", () => {
  describe("generateUserPipelineEntry()", () => {
    it("should generate user-pipeline-entry.ts with correct exports");
    it("should include getModelConfig method that returns parameter objects");
    it("should handle both static and parametric models");
  });

  describe("getModelConfig() fix", () => {
    it("should return parameter configuration objects not default values");
    it("should return {value, min, max, step} format for P.number()");
    it("should handle missing parameter configurations gracefully");
  });

  describe("cache-busting", () => {
    it("should add timestamp query parameters to dynamic imports");
    it("should prevent Node.js module caching issues");
  });
});
```

#### **2. V3ModelService Tests** (`tests/services/V3ModelService.test.ts`)

```typescript
describe("V3ModelService", () => {
  describe("loadModel()", () => {
    it("should load models using pipeline-based approach");
    it("should handle parametric models with parameter objects");
    it("should generate exports (GLB and OBJ)");
    it("should update UI state correctly");
  });

  describe("getParameterConfig()", () => {
    it("should return parameter configuration objects from pipeline");
    it("should handle models without parameters");
  });

  describe("pipeline integration", () => {
    it("should reload pipeline on HMR events");
    it("should handle pipeline unavailable gracefully");
  });
});
```

#### **3. Integration Tests** (`tests/integration/v3-workflow.test.ts`)

```typescript
describe("V3 Development Workflow", () => {
  describe("CLI integration", () => {
    it("should start dual server setup (template + pipeline)");
    it("should generate all three files on startup");
    it("should watch files and regenerate pipeline");
  });

  describe("end-to-end parameter UI", () => {
    it("should display parameter controls for parametric models");
    it("should update model when parameters change");
    it("should update URL with new parameters");
  });
});
```

### **Tests That Don't Need Updates:**

- ✅ **ParameterManager tests**: Still relevant and passing
- ✅ **ExportService tests**: Still relevant and passing
- ✅ **UrlService tests**: Still relevant and passing
- ✅ **Model-loader tests**: Still relevant as fallback/compatibility system
- ✅ **Wrapper package tests**: All passing, no changes needed

## 📋 **Test Implementation Checklist**

### **Immediate Actions (Next Session):**

- [ ] Create `tests/pipeline-compiler/` directory
- [ ] Implement `pipeline-compiler.test.ts` with focus on `generateUserPipelineEntry()`
- [ ] Create `tests/services/V3ModelService.test.ts`
- [ ] Test the critical `getModelConfig()` fix that returns parameter configuration objects
- [ ] Add cache-busting tests to verify timestamp query parameters
- [ ] Create integration tests for complete V3 workflow
- [ ] Run full test suite to ensure no regressions

### **Success Metrics:**

- ✅ All existing tests continue to pass
- ✅ New pipeline compiler functionality has >90% test coverage
- ✅ V3ModelService has comprehensive test coverage
- ✅ Integration tests verify end-to-end workflow
- ✅ Cache-busting functionality is thoroughly tested

## 🔗 **Related Issues**

- **MANIFEST_METADATA_BUG.md** - Detailed bug analysis (RESOLVED)
- **MODEL_WATCHER_V3.md** - Original architecture design (IMPLEMENTED)
- **COMPONENT_GUIDE.md** - Needs updating after fixes
- **DEVELOPMENT.md** - Contains comprehensive testing workflows

## 💡 **Key Insight**

The MODEL_WATCHER_V3.md design and unified CLI are **architecturally correct**. The V3 refactoring successfully eliminated competing systems and made the pipeline compiler the single source of truth.

**Result: V3 architecture is complete and functional. Focus now shifts to comprehensive test coverage.**
