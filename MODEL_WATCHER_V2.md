# Model Watcher V2 Implementation Plan

## 🎯 Current Status: Phase 2 COMPLETE - Real GLB Generation Working! 🎉

**✅ BREAKTHROUGH ACHIEVED:**

- ✅ **Import Issue SOLVED**: Used Vite to build wrapper package with proper `.js` extensions
- ✅ **Real GLB Generation**: All 6 test models compile to actual GLB blobs successfully
- ✅ **End-to-End Pipeline**: TypeScript → JavaScript → Manifold objects → GLB export → File writing
- ✅ **Standalone Architecture**: Node.js script approach proven superior to Vite plugin
- ✅ **File Watching**: Real-time recompilation on model file changes working perfectly
- ✅ **Error Handling**: Robust compilation status tracking and error reporting

**🔧 Key Technical Solution:**

**Problem**: TypeScript's ES module compilation wasn't adding `.js` extensions, causing Node.js import failures
**Solution**: Replaced `tsc` with Vite for wrapper package compilation

- Vite automatically handles ES module imports with proper extensions
- `preserveModules: true` maintains clean file structure
- TypeScript-aware compilation without fighting the module system

**📊 Proven Results:**

```
✅ Model compiled successfully: components/wheel (6472 bytes, 145ms)
✅ Model compiled successfully: components/chassis (1912 bytes, 12ms)
✅ Model compiled successfully: components/hmr-live-test (10600 bytes, 19ms)
[All 6 models compiling successfully with real GLB output]
```

**🚀 Ready for Phase 3:**

- Model compilation pipeline is 100% functional
- Real 3D models being generated and ready for UI display
- Architecture proven and stable for UI integration

**✅ CREATE-APP INTEGRATION COMPLETE:**

- Working solution successfully copied to `packages/create-app/templates/basic/`
- Template now includes model-watcher script, updated package.json, working examples
- Double-tested with fresh project creation - `npm run dev:models` works out of the box
- Users will get proven working solution when they run `@manifold-studio/create-app`

## Overview

Replace the current complex HMR system with a clean file-watcher + temp folder approach that separates model compilation from UI updates.

## Architecture: Standalone Script + UI Server (EVOLVED)

**Original Plan**: Two Vite instances
**Final Implementation**: Standalone Node.js script + Vite UI server

```
User Project:
├── Model Watcher (Node.js Script)
│   ├── Watches ./components/**/*.{ts,js} via chokidar
│   ├── Compiles models via Vite programmatic API
│   ├── Generates GLB blobs (when wrapper imports fixed)
│   ├── Writes to ./temp/ folder
│   └── Real-time file change detection with debouncing
│
└── UI Server (Vite)
    ├── Serves configurator UI
    ├── Watches ./temp/ for changes (Phase 3)
    └── Updates model viewer when blobs change (Phase 3)
```

**Why the Evolution?**

- ✅ **Simpler**: No complex Vite plugin lifecycle issues
- ✅ **More Reliable**: Follows proven wrapper/pipeline pattern
- ✅ **Better Debugging**: Clear separation of concerns
- ✅ **Easier Testing**: Standalone script can be tested independently

## 🧠 Key Learnings & Insights

### 1. **TypeScript + ES Modules + Node.js = Complex**

- **Problem**: TypeScript's `tsc` doesn't add `.js` extensions to relative imports
- **Impact**: Node.js ES modules require explicit `.js` extensions
- **Solution**: Use TypeScript-aware build tools (Vite) instead of raw `tsc`

### 2. **Don't Fight the Tools - Leverage Them**

- **Initial Approach**: Manually fix TypeScript config and add `.js` extensions
- **Better Approach**: Use Vite which handles this complexity automatically
- **Lesson**: Modern build tools solve these problems - use them instead of workarounds

### 3. **Standalone Scripts > Vite Plugins for Complex Pipelines**

- **Vite Plugin Issues**: Complex lifecycle, import resolution conflicts, circular dependencies
- **Standalone Script Benefits**: Clear execution model, easier debugging, follows proven patterns
- **Architecture**: Separate concerns - model compilation vs UI serving

### 4. **Test-Driven Development Reveals Real Issues**

- **Tests Pass**: Wrapper tests import from source files (no import issues)
- **Runtime Fails**: Model files import from compiled dist (import issues surface)
- **Lesson**: Test in the actual runtime environment, not just isolated unit tests

### 5. **Vite's `preserveModules` is Perfect for Libraries**

- **Standard Vite**: Bundles everything into single files
- **preserveModules**: Maintains file structure while fixing imports
- **Result**: Clean library output that works in Node.js ES modules

### 6. **Always Copy Working Solutions from Test to Production**

- **Development Pattern**: Work out solutions in gitignored test directories first
- **Risk**: Important breakthroughs can be lost if only in gitignored folders
- **Solution**: Copy proven working code to tracked locations (like create-app templates)
- **Lesson**: Test in isolation, then integrate into permanent locations

## Implementation Phases

### Phase 1: Model Watcher Plugin ✅ COMPLETE → EVOLVED TO STANDALONE SCRIPT

**Goal**: ~~Create Vite plugin~~ → **Create standalone Node.js script** that watches model files and compiles them

**Verification**:

- [x] Script detects model file changes ✅
- [x] Compiles TypeScript models successfully ✅
- [x] Writes temp/manifest.json with model list ✅
- [x] Console logs show compilation pipeline working ✅
- [x] Real-time file watching with debouncing ✅

**Status**: ✅ **ARCHITECTURE EVOLVED** - Moved from Vite plugin to standalone script for better reliability

**What Was Tested:**

- ✅ Model discovery found all 6 test files correctly
- ✅ Temp folder structure created: `temp/blobs/`, `temp/logs/`, `temp/core/`, `manifest.json`
- ✅ Manifest JSON generated with proper model metadata and compilation status
- ✅ File watcher setup with chokidar and debouncing (300ms)
- ✅ Console logging provides rich debugging output
- ✅ Real-time recompilation on file changes verified
- ✅ TypeScript compilation via Vite programmatic API working

**Files Created**:

- `test-local-project/scripts/model-watcher.ts` (standalone script)
- `test-local-project/vite.watcher.config.ts` (compilation config)
- ~~`packages/configurator/src/plugins/model-watcher.ts`~~ (deprecated approach)

**Test Plan**:

```bash
# 1. Start standalone model watcher
npm run dev:models-standalone

# 2. Edit a model file and watch console output
# 3. Check temp/ folder contents
ls -la temp/
cat temp/manifest.json

# 4. Verify recompilation triggered
# Watch for "🔄 Processing debounced change event" in console
```

### Phase 2: Blob Generation Pipeline ✅ ARCHITECTURE COMPLETE - IMPORT ISSUE BLOCKING GLB

**Goal**: Generate GLB blobs from compiled models and write to temp folder

**Verification**:

- [x] Models compile to JavaScript successfully ✅
- [x] TypeScript → JavaScript compilation pipeline ✅
- [x] Temp folder structure and file organization ✅
- [x] Manifest includes compilation metadata (status, timing, paths) ✅
- [x] Real-time recompilation on file changes ✅
- [x] Error handling and status tracking ✅

**Status**: ✅ **COMPLETE** - Full pipeline working with real GLB generation!

**🎉 SOLUTION IMPLEMENTED: Vite-Based Wrapper Compilation**

**Root Cause**: TypeScript's `tsc` compiler doesn't add `.js` extensions to ES module imports
**Solution**: Replaced `tsc` with Vite for wrapper package compilation

**Key Changes**:

```javascript
// Before (tsc output):
export { Manifold } from "./lib/manifold"; // ❌ Missing .js

// After (Vite output):
import { Manifold } from "./lib/manifold.js"; // ✅ Proper extension
```

**Implementation**:

- Created `packages/wrapper/vite.config.ts` with `preserveModules: true`
- Updated wrapper build script: `"build": "vite build && tsc --emitDeclarationOnly"`
- Maintained TypeScript declarations while fixing ES module imports

**Proven Results**:

- All 6 test models compile successfully
- Real GLB files generated (6472 bytes, 1912 bytes, 10600 bytes, etc.)
- Module loading, Manifold generation, and GLB export all functional
- File watching triggers real recompilation with actual 3D model output

**Files Created**:

- `packages/wrapper/vite.config.ts` (Vite config for wrapper compilation)
- `packages/create-app/templates/basic/scripts/model-watcher.ts` (integrated into create-app template)
- `packages/create-app/templates/basic/components/wheel.ts` (working example model)
- Updated `packages/create-app/templates/basic/package.json.hbs` (includes dev:models script)
- Updated `packages/create-app/templates/basic/README.md.hbs` (documents model development workflow)

**Test Plan**:

```bash
# 1. Build wrapper with Vite (fixes import extensions)
cd packages/wrapper && npm run build

# 2. Create new project with working template
npx @manifold-studio/create-app my-project

# 3. Start model watcher - should show real GLB generation
cd my-project && npm run dev:models

# 4. Verify real GLB blobs created and file watching works
# Edit any .ts file in components/ and watch for real GLB regeneration
```

### Phase 3: UI File Watcher ✅ IMPLEMENTED (PARTIAL)

**Goal**: UI watches temp folder and updates model viewer when blobs change

**Status**: **PARTIALLY COMPLETE** - Works for static models, but parametric models need redesign

**What We Implemented**:

- ✅ UI detects temp/manifest.json changes
- ✅ Model selector updates with new models
- ✅ Model viewer loads GLB files from temp folder
- ✅ No full page reloads
- ✅ Combined `npm run dev` script runs both model watcher and UI

**Critical Realization**: **Parametric Models Don't Work**

Our current pipeline only handles **static models**:

```
TypeScript → Static GLB (with default params) → UI displays GLB
```

But **parametric models** need:

```
TypeScript → Parameter Config → UI Controls → Dynamic GLB generation
```

**The Problem**:

- Models like `wheel.ts` with `createConfig()` need UI parameter input
- Current pipeline pre-compiles GLBs with default parameters only
- No way to pass user parameters from UI to model compilation
- Parametric models become static models (losing their main feature!)

**Files Implemented**:

- ✅ `packages/configurator/src/watchers/temp-folder-watcher.ts`
- ✅ `packages/configurator/src/state/store.ts` (reads from manifest.json)
- ✅ `packages/configurator/src/services/ModelService.ts` (loads from temp GLBs)
- ✅ Combined dev script in create-app template

**Test Results**:

```bash
npm run dev  # ✅ Starts both model watcher + UI server
# Edit static model → ✅ UI updates without page reload
# Edit parametric model → ❌ Parameters ignored, uses defaults only
```

---

## 🚨 CRITICAL ARCHITECTURAL DECISION NEEDED

### The Parametric Model Problem

**Current Issue**: Our Phase 3 implementation works great for static models, but **completely breaks parametric models**.

**Root Cause**: We're pre-compiling models to static GLB files, but parametric models need:

1. **Parameter extraction** from the compiled model
2. **UI controls generation** (sliders, checkboxes, etc.)
3. **Real-time model regeneration** when parameters change
4. **Dynamic GLB export** with current parameter values

### Proposed Solution: Pure Function Compilation + Runtime Execution

**Vision**: Compile models to pure functions that can run both in development (via Vite) and production (via Web Workers).

#### Architecture Overview

**1. Watcher Compiles to Pure Functions**

```typescript
// components/wheel.ts (source)
export const wheelConfig = createConfig(...)

// ↓ Watcher compiles to ↓

// temp/functions/wheel.js (compiled function)
export function generateWheel(params) {
  // Pure function - no imports, just math + Manifold calls
  return manifold; // Returns Manifold object
}
export const config = { /* parameter definitions */ };
```

**2. Development: Vite Hosts Functions**

```typescript
// Vite middleware/plugin
app.post("/api/glb/:modelId", async (req, res) => {
  const fn = await import(`./temp/functions/${modelId}.js`);
  const manifold = fn.generateWheel(req.body.params);
  const glb = manifoldToGLB(manifold);
  res.send(glb);
});
```

**3. Production: Web Worker Hosts Functions**

```typescript
// In production bundle
const worker = new Worker('/model-functions.js');
worker.postMessage({ modelId: 'wheel', params: {...} });
worker.onmessage = (glbBlob) => updateModelViewer(glbBlob);
```

#### Benefits

- **✅ Static hosting**: Production builds don't need servers
- **✅ Real-time parameters**: UI can pass parameters to functions
- **✅ Performance**: Functions run in workers (non-blocking)
- **✅ Simple development**: Vite handles function hosting during dev
- **✅ Clean separation**: Compilation vs execution are separate concerns

#### Implementation Challenges

**A. Function Compilation**: How do we compile TypeScript models to pure functions?

- Strip imports, inline dependencies
- Bundle with Manifold + wrapper utilities
- Output self-contained functions

**B. Manifold in Workers**: Can Manifold WASM run in web workers?

- Need to test Manifold + WASM in worker context
- Might need to pass data back to main thread

**C. GLB Export in Browser**: Can we do `manifoldToGLB()` client-side?

- Wrapper already has this capability
- Just need to ensure it works in workers

#### Next Steps

1. **Prototype function compilation** - Can we compile a simple model to a pure function?
2. **Test Manifold in workers** - Does WASM work in Web Worker context?
3. **Design Vite plugin** - How should the development server host these functions?
4. **Plan production bundling** - How do we bundle functions for production workers?

---

### Phase 4: Integration & Polish (PAUSED)

**Status**: **PAUSED** - Need to resolve parametric model architecture first

**Goal**: Integrate both Vite instances and add production build support

**Verification**:

- [ ] `npm run dev` starts both instances
- [ ] File changes trigger end-to-end updates
- [ ] `npm run build` generates production assets
- [ ] Debouncing prevents rapid rebuilds

**Files to Create**:

- `packages/configurator/vite.models.config.ts`
- `test-local-project/vite.models.config.ts`

**Files to Modify**:

- `packages/configurator/package.json`
- `test-local-project/package.json`

## Temp Folder Structure

```
temp/
├── manifest.json          # Model registry
├── timestamps.json        # Last update times
├── blobs/
│   ├── main.glb
│   ├── components-chassis-copy.glb
│   └── components-wheel.glb
└── logs/
    └── compilation.log     # Debug info
```

### manifest.json Format

```json
{
  "models": [
    {
      "id": "components/chassis-copy",
      "name": "Chassis Copy",
      "type": "static",
      "blobPath": "./blobs/components-chassis-copy.glb",
      "lastUpdated": "2024-01-15T10:30:00Z",
      "size": 1024
    }
  ],
  "lastBuild": "2024-01-15T10:30:00Z"
}
```

## Key Design Decisions

### 1. File Watching Strategy

- **Use chokidar** for cross-platform file watching
- **Debounce changes** (300ms) to avoid rapid rebuilds
- **Watch only model files** (not temp folder from model watcher side)

### 2. Communication Between Instances

- **File-based communication** via temp folder
- **No WebSockets needed** - simpler architecture
- **Polling manifest.json** every 500ms from UI side

### 3. Error Handling

- **Compilation errors** written to temp/logs/
- **UI shows error state** when compilation fails
- **Graceful degradation** if temp folder missing

### 4. Development vs Production

- **Development**: Both Vite instances running
- **Production**: Pre-compile all models, serve static UI

## Potential Issues & Solutions

### Issue 1: File System Race Conditions

**Problem**: UI reads blob while being written
**Solution**: Write to temp file, then atomic rename

### Issue 2: TypeScript Compilation

**Problem**: Models need compilation before import
**Solution**: Use Vite's built-in TypeScript support

### Issue 3: Import Path Resolution

**Problem**: Dynamic imports might fail
**Solution**: Use absolute paths, configure Vite resolve

### Issue 4: Blob URL Cleanup

**Problem**: Memory leaks from old blob URLs
**Solution**: Revoke old URLs before creating new ones

## Success Criteria

1. **No more HMR conflicts** - Clean separation of concerns
2. **Fast feedback loop** - Model changes visible in <2 seconds
3. **Reliable updates** - No cache invalidation issues
4. **Easy debugging** - Clear logs and temp folder inspection
5. **Scalable** - Works with any number of models

## Migration Plan

1. **Keep existing HMR** as fallback during development
2. **Implement new system** alongside current one
3. **Test thoroughly** with various model types
4. **Switch default** to new system once stable
5. **Remove old HMR code** after verification period
