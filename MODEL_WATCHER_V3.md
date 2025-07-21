# Model Watcher V3: Pipeline-Based Architecture

## 🎯 **Current Status (June 2025)**

**✅ V3 Core System: COMPLETE** - Pipeline compilation, manifest generation, source-based development, cache-busting HMR, and ModelViewer integration all working reliably.

**✅ Configurator Test Suite: COMPLETE** - All critical cache-busting tests fixed, proper test fixtures implemented, simplified model discovery philosophy adopted. 50/50 tests passing.

**🔄 Next Priority: Create-App Integration** - Port the working V3 setup to create-app templates so users can scaffold projects with the complete V3 workflow.

## Overview

V3 represents a fundamental shift from dynamic model imports to **compiled pipeline functions**. The architecture separates concerns cleanly: pipeline compilation, configurator library, user project orchestration, and UI serving.

## Architecture Principles

### Clean Division of Responsibilities

- **Pipeline Compiler**: Source → Pipeline + Manifest
- **Configurator Library**: UI components that consume pipeline + manifest
- **User Project**: Imports configurator, provides container, handles pipeline path
- **UI Server**: Just serves files, no special logic

### Hot Reload Architecture

- **Pipeline watcher** → rebuilds pipeline + manifest
- **UI detects pipeline change** → reloads models list
- **Config UI change** → triggers GLB regeneration
- **File change** → pipeline rebuild → UI reload

### Architectural Simplifications

- **Configurator is library-only** - No standalone app needed since development happens in user projects
- **Single build system** - Configurator has one Vite config for library build only
- **Test in user context** - Configurator development happens in `test-v3-development`, not as standalone app

## What Didn't Work in V1 & V2

### V1 Failures: Dynamic Import Hell

**The Problem**: Complex HMR with runtime dynamic imports

```typescript
// V1 approach that failed
const timestamp = Date.now() + Math.random();
const importPath = `${modelDef.path}?t=${timestamp}&r=${Math.random()}`;
modelModule = await import(importPath); // ❌ Unreliable cache busting
```

**Issues**:

- **Cache invalidation**: Vite's module cache couldn't be reliably cleared
- **Dependency chains**: Complex import graphs broke HMR updates
- **State corruption**: Module reloads lost parametric model state
- **Timing issues**: Race conditions between file changes and imports
- **Development vs production**: Different behavior in dev/prod modes

**Evidence**: Extensive debugging logs, aggressive cache busting attempts, HMR event listeners - all failed to provide reliable model updates.

### V2 Failures: Static GLB Pre-compilation

**The Problem**: Pre-compiled GLBs broke parametric models

```typescript
// V2 approach that failed
TypeScript → Static GLB (default params) → UI displays GLB
// ❌ No way to pass UI parameters to model generation
```

**Issues**:

- **Parametric models became static**: Lost real-time parameter updates
- **No parameter passing**: UI couldn't influence model generation
- **Development workflow broken**: Parametric models lost their main feature
- **Architecture mismatch**: Static compilation vs dynamic parameter needs

**Critical Realization**: The build artifact should be the **pipeline function**, not the GLBs themselves.

### Key Lessons for V3

1. **Avoid complex HMR**: Simple blackbox replacement instead
2. **Preserve parametric functionality**: Pipeline must accept parameters
3. **Separate compilation from execution**: Build functions, execute with parameters
4. **State lives outside pipeline**: UI state survives pipeline reloads

### V3 Development Challenges: The "Perfect Storm" (June 2025)

**The Problem**: After implementing V3 architecture, HMR appeared to work (logs showed pipeline reloading, new GLB files generated) but 3D models weren't updating visually.

**Root Cause Analysis**: A "perfect storm" of 5 different caching/interface issues that masked each other:

1. **NPM Link Caching** - Built configurator packages served stale code despite source changes
2. **Dynamic Import Caching** - Browser cached pipeline modules even with HMR events
3. **Interface Mismatch** - `IModelService.loadModel()` signature didn't match `V3ModelService` implementation
4. **Parameter Order Bug** - Store called `loadModel(modelId, callback, params)` instead of `loadModel(modelId, params, callback)`
5. **ModelViewer Web Component** - Didn't respond to programmatic `src` changes without forced reload

**Why This Was So Hard to Debug**: Each issue masked the others. Fixing any single issue still left the system broken, making it appear that fixes weren't working. Only when all 5 issues were resolved simultaneously did HMR start working.

**The Solution**:

- **Source-Based Development** - Vite aliases to import configurator source directly
- **Cache-Busting** - Timestamp query parameters on dynamic imports
- **Interface Alignment** - Updated `IModelService` to match implementation
- **Parameter Fix** - Corrected argument order in store calls
- **Forced ModelViewer Reload** - Advanced update method for programmatic changes

**Key Learning**: Complex systems can have multiple simultaneous failures that mask each other. When debugging appears ineffective, step back and look for systemic issues rather than continuing to debug individual components.

### V3 Configurator Test Suite Fixes (June 2025)

**The Problem**: After completing V3 core system, configurator tests were failing (46/50 passing), indicating potential fragilities in the cache-busting mechanism that the entire V3 HMR system depends on.

**Root Cause Analysis**: Multiple test issues that needed systematic resolution:

1. **Store Test Parameter Mismatch** - Mock implementation didn't match actual `IModelService.loadModel()` signature
2. **Cache-Busting URL Malformation** - Decimal timestamps caused esbuild parsing errors in dynamic imports
3. **Development Models Path Issues** - Incorrect paths (`../../examples/` instead of `./examples/`)
4. **Test Pollution** - Global configuration state not reset between tests
5. **Outdated Model Discovery Philosophy** - Tests used old "clever" discovery instead of simplified approach
6. **Missing Test Fixtures** - Tests relied on external examples instead of dedicated fixtures

**The Solution**:

- **Fixed Mock Interface** - Updated to 3-parameter signature: `(modelId, params, onProgress)`
- **Integer Timestamps** - Changed cache-busting URLs to use integer timestamps to avoid esbuild parsing issues
- **Simplified Model Discovery** - Implemented "less clever" approach requiring `main.ts` and looking only in specific paths
- **Proper Test Fixtures** - Created dedicated test models with mock Manifold objects
- **Test Isolation** - Added `afterEach` cleanup to prevent test pollution
- **Cleaned Up Debug Artifacts** - Removed obsolete `debug-models.js` and `debug-models.test.ts` files

**Result**: All 50/50 configurator tests now pass, validating the critical cache-busting mechanism that V3 HMR depends on.

**Key Learning**: Test failures in foundational systems like cache-busting are "canaries in the coal mine" - they indicate potential runtime issues that could affect the entire system, making them high-priority fixes.

## Core Architecture

```
User Project (Regular NPM)
├── Model Source Files (main.ts, components/*.ts)
├── Pipeline Compiler (Vite Process #1) → temp/pipeline.js + temp/manifest.json
├── UI Server (Vite Process #2) → Serves UI + Pipeline artifacts
└── Configurator Library → UI Components + Pipeline Execution
```

### Component Responsibilities

#### 1. User Project

- **Regular NPM project** that users can run with `npm run dev`
- **Model source code** using wrapper and configuration abstraction
- **Imports configurator library** to aid development
- **Orchestrates** the relationship between pipeline and UI

#### 2. Pipeline Compiler (Vite Process #1)

- **Watches** model source files (`main.ts`, `components/*.ts`)
- **Compiles** TypeScript to self-contained pipeline functions
- **Generates** `temp/pipeline.js` (executable pipeline)
- **Produces** `temp/manifest.json` (model metadata and configurations)
- **Rebuilds** automatically on file changes

#### 3. UI Server (Vite Process #2)

- **Serves** user project HTML and assets
- **Serves** pipeline artifacts (`/temp/pipeline.js`, `/temp/manifest.json`)
- **Provides** hot module replacement for UI changes
- **No special logic** - just a standard Vite dev server

#### 4. Configurator Library

**Pure Library Architecture**: The configurator is now a library-only package (no standalone app) since development happens in user projects like `test-v3-development`.

The configurator is composed of separate modules that communicate via events:

**Core Modules:**

1. **State Management for selected model** - Tracks current model selection
2. **State Management for config UI** - Manages parameter values and UI state
3. **Pipeline Execution** - Loads pipeline library and executes it to generate GLBs
4. **GLB Renderer** - Wraps `<model-viewer>` for 3D visualization
5. **Model List Renderer** - Displays available models from manifest
6. **Config UI Renderer** - Generates parameter controls from model configurations

**Supporting Modules:** 7. **Pipeline Loader/Manager** - Hot-reloads pipeline when it changes 8. **Export/Download Manager** - Handles GLB/STL downloads 9. **Error/Status Display** - Shows loading states and error messages 10. **URL State Sync** - Persists model selection and parameters in URL 11. **Theme/Styling System** - CSS and responsive layout 12. **Event System/Coordinator** - Inter-module communication

**Module Communication:**

```
Pipeline Loader detects change → Event → State Management updates → UI re-renders
Config UI change → Event → Pipeline Execution → GLB Renderer updates
Model selection → Event → Config UI loads new parameters → Pipeline executes
```

## Current V3 Status

### ✅ **What's Working (Completed June 2025)**

- **Pipeline Compiler** - Compiles models to `temp/pipeline.js` with full TypeScript support
- **Dual Vite Architecture** - Pipeline build server + UI server working seamlessly
- **Model Discovery** - Simplified philosophy: requires `main.ts`, looks only in `./main.{ts,js}` and `./components/**/*.{ts,js}`
- **Parameter Extraction** - Extracts configs from parametric models with type safety
- **Manifest Generation** - Structured `temp/manifest.json` generated automatically
- **Hot Reload Pipeline** - File changes → pipeline rebuild → manifest regeneration → UI updates
- **Source-Based Development** - Direct source imports eliminate npm link caching issues
- **Cache-Busting HMR** - Dynamic imports with integer timestamps prevent module caching and esbuild parsing errors
- **ModelViewer Integration** - Forced reload ensures visual updates work reliably
- **Production-Ready Code** - Clean, minimal implementation without debug artifacts
- **Comprehensive Test Suite** - 50/50 configurator tests passing with proper test fixtures and cache-busting validation

### 🎯 **Current Priority: Create-App Integration**

- **Update Templates** - Port working V3 setup to create-app templates
- **Simplify User Experience** - Minimal user code with `startConfigurator()` API
- **End-to-End Testing** - Verify complete scaffolding → development workflow

## Implementation Status & Next Steps

### ✅ **V3 Core System: COMPLETE (June 2025)**

- **Pipeline Compiler** - Working dual Vite architecture with model compilation
- **Manifest Generation** - Structured `temp/manifest.json` with Vite plugin integration
- **Hot Reload System** - File changes trigger pipeline + manifest updates + UI refresh
- **Source-Based Development** - Direct source imports eliminate build chain complexity
- **Cache-Busting HMR** - Reliable pipeline reloading with integer timestamp-based cache invalidation
- **ModelViewer Integration** - Forced reload ensures visual updates work correctly
- **Production-Ready Code** - Clean implementation without debug artifacts
- **Type Safety** - Full TypeScript support throughout pipeline compilation
- **Simplified Model Discovery** - Less clever approach: requires `main.ts`, looks only in specific paths
- **Comprehensive Testing** - 50/50 configurator tests passing with proper fixtures and cache-busting validation

### 🎯 **Current Priority: Create-App Integration**

**Goal**: Port the working V3 setup from `test-v3-development` to `create-app` templates so users can scaffold projects with the complete V3 workflow.

**Success Criteria**:

- `npx @manifold-studio/create-app my-project` → `cd my-project` → `npm run dev` → edit models → see changes immediately
- No manual setup required - everything works out of the box
- Same reliable HMR experience as `test-v3-development`

### **Create-App Integration Plan**

#### **Phase 1: Copy Working V3 Setup**

1. **Examine Current Templates** - Understand existing `create-app` structure and identify what needs updating
2. **Copy Essential V3 Files** from `test-v3-development`:
   - `vite.config.ts` - Source-based development with configurator aliases
   - `vite-plugins/pipeline-hmr.ts` - Custom HMR plugin for pipeline changes
   - `package.json` - Updated scripts for dual-server development
   - `src/main.ts` - Minimal configurator initialization
3. **Update Template Structure** - Organize files to match V3 architecture requirements
4. **Remove V1/V2 Artifacts** - Clean out outdated model-watcher scripts and configurations

#### **Phase 2: Simplify User Experience**

1. **Minimal User Code** - Reduce user project to just `startConfigurator()` call
2. **Standard NPM Workflow** - Ensure `npm run dev` works out of the box
3. **Clean Dependencies** - Include only necessary packages, remove development artifacts
4. **Clear Documentation** - Update README with V3 workflow and development guide

#### **Phase 3: Test End-to-End Workflow**

1. **Scaffold New Project** - Test `npx create-app` with updated templates
2. **Verify Complete Pipeline** - Source → pipeline → manifest → UI → HMR
3. **Test HMR Reliability** - File changes → automatic updates without manual intervention
4. **Cross-Platform Testing** - Ensure workflow works on different operating systems

#### **Phase 4: Production Readiness**

1. **Build Process** - Ensure `npm run build` creates production-ready artifacts
2. **Static Hosting** - Verify built projects work on static hosting platforms
3. **Error Handling** - Graceful degradation for common development issues
4. **Performance** - Optimize build times and HMR responsiveness

## Technical Implementation Details

### ✅ Dual Vite Architecture (Implemented)

**Working Implementation**: See `test-v3-development/` for complete dual-server setup with:

- `vite.config.ts` - UI server with source-based configurator development
- `vite.pipeline.config.ts` - Pipeline build server with manifest generation
- `package.json` - Concurrent scripts: `npm run dev` starts both servers
- `vite-plugins/` - Custom HMR and manifest generation plugins

### ✅ Pipeline Artifacts (Implemented)

**Working Implementation**: Pipeline compiler generates:

- `temp/pipeline.js` - Self-contained module with `getAvailableModels()`, `generateModel()`, `getModelConfig()`
- `temp/manifest.json` - Structured model metadata with parameter schemas
- Automatic rebuilds on source file changes with HMR integration

### ✅ Configurator Library Interface (Implemented)

**Working Implementation**: `packages/configurator/src/index.ts` exports `startConfigurator()` API with:

- **Minimal User Code** - Single function call handles all initialization
- **V3 Pipeline Support** - `useV3Pipeline: true` option enables pipeline mode
- **Complete Options Interface** - Container, pipeline path, default model, callbacks
- **Internal Architecture** - 50+ test-validated modules with proper separation of concerns

### ✅ Hot Reload Implementation (Implemented)

**Working Implementation**: `packages/configurator/src/core/pipeline-loader.ts` provides:

- **PipelineLoader Class** - Cache-busting dynamic imports with integer timestamps
- **V3ModelService Integration** - Automatic pipeline reloading on file changes
- **State Preservation** - URL parameters and localStorage maintain UI state across reloads
- **Custom HMR Events** - Vite plugins trigger pipeline updates via event system

## ✅ Complete Development Workflow (Implemented)

**Working in `test-v3-development/`**:

1. `npm run dev` → Single server starts → Edit `main.ts` → See changes immediately
2. **File Change Flow**: Source edit → Pipeline rebuild → HMR event → UI reload → GLB update → 3D viewer refresh
3. **Error Handling**: Compilation errors in status bar, graceful degradation for failures

## ✅ Create-App Template Changes (Implemented)

**Working Implementation**: `packages/create-app/templates/basic/` contains complete V3 template with:

- **Dual Vite Configuration** - `vite.config.ts` + `vite.pipeline.config.ts` with proper server setup
- **Pipeline Infrastructure** - `pipeline-entry.ts`, manifest generation, HMR plugins
- **Updated Scripts** - `npm run dev` starts concurrent pipeline + UI servers
- **V3 Integration** - Source-based configurator development with all V3 features

## Next Steps: Create-App Integration Testing

The V3 core system is complete and validated. The final step is testing the end-to-end create-app workflow:

1. **Port Working V3 Setup** - Copy `test-v3-development` configuration to create-app templates
2. **Test Complete Workflow** - `npx create-app` → `npm run dev` → edit models → see changes immediately
3. **Verify Template Integration** - Ensure all V3 features work in scaffolded projects
4. **Cross-Platform Testing** - Validate workflow on different operating systems

## Success Criteria

### ✅ **Architecture Goals**

- **Clean separation of concerns**: Pipeline compiler, configurator library, user project, UI server
- **Reliable hot reload**: Pipeline watcher → rebuild → UI reload → GLB regeneration
- **Library-based configurator**: User projects import and use configurator components
- **Regular NPM projects**: Users can run standard `npm run dev` workflow

### ✅ **Technical Requirements**

- **Parametric models work**: Real-time parameter updates via pipeline execution
- **State preservation**: UI state survives pipeline reloads (URL + localStorage)
- **Error handling**: Graceful degradation for compilation and runtime errors
- **Production ready**: Static hosting compatible, no server dependencies

### ✅ **Developer Experience**

- **Simple workflow**: `npx create-app` → `npm run dev` → edit models → see changes
- **Familiar tools**: Standard Vite, TypeScript, NPM - no custom tooling
- **Fast feedback**: Sub-second pipeline rebuilds and UI updates
- **Debugging support**: Clear error messages and status indicators

### ✅ **Implementation Quality**

- **Modular configurator**: 12 separate modules communicating via events
- **Clean interfaces**: Well-defined APIs between components
- **Code reuse**: Salvage and improve 70% of V1 logic
- **Test coverage**: Unit tests for pipeline compiler and configurator modules

## Next Steps

### ⚡ **CURRENT PRIORITY: Create-App Integration**

**Immediate Actions**:

1. **Examine Current Templates** - Understand `packages/create-app/templates/` structure
2. **Copy Working V3 Setup** - Port essential files from `test-v3-development`:
   - Vite configurations with source-based development
   - HMR plugins and pipeline compilation setup
   - Package.json scripts for dual-server workflow
   - Minimal user code with `startConfigurator()` API
3. **Test Scaffolding** - Verify `npx create-app` → `npm run dev` → edit models workflow
4. **Update Documentation** - V3 development guide and user instructions

### **Future Enhancements**

1. **Production Optimization** - Static hosting, build performance, error handling
2. **Advanced Features** - Web Workers, export formats, debugging tools
3. **Developer Experience** - Better error messages, development tooling
4. **Performance Monitoring** - Build times, HMR responsiveness, GLB generation speed
