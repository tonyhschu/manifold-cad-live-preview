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

- `test-local-project/scripts/model-watcher.ts` (complete standalone implementation)
- `test-local-project/vite.watcher.config.ts` (Vite config for script compilation)

**Test Plan**:

```bash
# 1. Start model watcher and observe compilation
npm run dev:models-standalone

# 2. Edit model file and verify recompilation
# Watch console for: "🔄 Processing debounced change event"

# 3. Check compilation artifacts
ls -la temp/core/        # Compiled JS files
cat temp/manifest.json   # Compilation status and metadata

# 4. Verify file watching works
# Edit any .ts file in components/ and watch console output
```

### Phase 3: UI File Watcher ⏳ READY TO IMPLEMENT

**Goal**: UI watches temp folder and updates model viewer when blobs change

**Prerequisites**: ✅ **ALL MET** - Phase 2 provides complete temp folder pipeline

**Verification**:

- [ ] UI detects temp/manifest.json changes
- [ ] Model selector updates with new models
- [ ] Model viewer updates when current model blob changes
- [ ] No full page reloads
- [ ] Combined `npm run dev` script runs both model watcher and UI

**Architecture**:

- **Model Watcher** (standalone script): Watches `./components` → Compiles → Writes `./temp`
- **UI Server** (Vite): Watches `./temp` → Updates model viewer → No page reload

**Files to Create**:

- `packages/configurator/src/watchers/temp-folder-watcher.ts`
- Combined dev script configuration

**Files to Modify**:

- `packages/configurator/src/components/canvas/ModelViewer.ts`
- `packages/configurator/src/state/store.ts`
- `package.json` scripts for combined development experience

**Test Plan**:

```bash
# 1. Start combined development environment
npm run dev  # Should start both model watcher + UI server

# 2. Edit model file in components/
# 3. Verify UI updates without page reload
# 4. Check browser console for temp folder watcher logs
# 5. Verify model selector shows updated models
```

### Phase 4: Integration & Polish

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
