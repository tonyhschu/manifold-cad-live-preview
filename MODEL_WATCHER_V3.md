# Model Watcher V3: Pipeline-Based Architecture

## Overview

V3 represents a fundamental shift from dynamic model imports to **compiled pipeline functions**. The key insight: treat the pipeline as a library/blackbox that gets replaced entirely, with client-side re-render logic handling GLB updates.

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

## Core Architecture

```
Source Files → Pipeline Compiler → Pipeline Functions → UI Harness → Live GLB Rendering
     ↓              ↓                    ↓              ↓              ↓
   main.ts      Vite Build         Compiled JS     Parameter UI    Model Viewer
components/    (File Watcher)     (Hot Reload)    (State Mgmt)    (GLB Display)
```

### Key Principles

1. **Pipeline as Build Artifact**: The compiled pipeline function is the primary output, not GLBs
2. **Blackbox Replacement**: Entire pipeline gets replaced on changes (no complex HMR)
3. **Client-Side Execution**: Pipeline runs in main thread (initially), workers later
4. **State Preservation**: UI state lives outside pipeline, survives pipeline reloads
5. **Dual Server Architecture**: Pipeline build server + UI harness server

## V1 Code Salvage Analysis

### ✅ **Directly Reusable (40%)**

#### Core Interfaces & Types

```typescript
// From packages/configurator/src/core/model-loader.ts
export interface ModelMetadata {
  name: string;
  description: string;
  author?: string;
  version?: string;
}

export interface ModelRegistryEntry {
  id: string;
  path: string;
  name: string;
  type: "static" | "parametric";
}

// From packages/configurator/src/services/ModelService.ts
interface ModelLoadResult {
  model: any;
  metadata?: ModelMetadata;
  isParametric?: boolean;
  config?: ParametricConfig;
  exports?: { objUrl: string; glbUrl: string };
}
```

#### Parametric Model Detection

```typescript
// Perfect for V3 pipeline compilation
function isParametricConfig(obj: any): obj is ParametricConfig {
  return (
    obj &&
    typeof obj === "object" &&
    "parameters" in obj &&
    "generateModel" in obj &&
    typeof obj.generateModel === "function"
  );
}
```

### 🔄 **Adaptable for V3 (30%)**

#### File Discovery Logic

```typescript
// V1: Runtime discovery with import.meta.glob
const modelModules = import.meta.glob([
  "./main.{ts,js}",
  "./components/**/*.{ts,js}",
]);

// V3: Same patterns for pipeline compilation
// But compile to functions instead of runtime imports
```

#### Model Name Extraction

```typescript
// Reusable for pipeline compilation
function extractModelName(filePath: string): string {
  const cleanPath = filePath.replace(/^\.\//, "").replace(/\.(ts|js)$/, "");
  if (cleanPath === "main") return "main";
  return cleanPath;
}
```

### ❌ **Discard for V3 (30%)**

#### Complex HMR Logic

```typescript
// V1: Complex Vite HMR with cache busting
import.meta.hot.on("vite:afterUpdate", async (data) => {
  // Complex file change detection, cache invalidation
});

// V3: Simple pipeline replacement
const newPipeline = await import(`./temp/pipeline.js?t=${timestamp}`);
```

#### Runtime Dynamic Imports

```typescript
// V1: Runtime imports with aggressive cache busting
const timestamp = Date.now() + Math.random();
modelModule = await import(`${path}?t=${timestamp}&r=${Math.random()}`);

// V3: Pre-compiled pipeline functions
const manifold = pipeline.generateModel(modelId, params);
```

## V3 Implementation Plan

### Phase 1: Foundation & Code Salvage

#### Step 1.1: Extract Reusable Types

- **Goal**: Create clean type definitions for V3
- **Action**: Move interfaces to `packages/configurator/src/types/`
- **Files**:
  - `types/model.ts` - ModelMetadata, ModelRegistryEntry
  - `types/pipeline.ts` - New pipeline interfaces
  - `types/service.ts` - Service interfaces

#### Step 1.2: Create Pipeline Interfaces

```typescript
// New interfaces for V3
export interface ModelPipeline {
  getAvailableModels(): ModelConfig[];
  generateModel(modelId: string, params?: any): Manifold;
  getModelConfig(modelId: string): ParametricConfig | null;
}

export interface ModelConfig {
  id: string;
  name: string;
  type: "static" | "parametric";
  config?: ParametricConfig;
}
```

#### Step 1.3: Extract Utility Functions

- **Goal**: Salvage reusable logic from V1
- **Action**: Create `packages/configurator/src/utils/`
- **Files**:
  - `utils/model-detection.ts` - `isParametricConfig()`, etc.
  - `utils/path-utils.ts` - `extractModelName()`, etc.

### Phase 2: Pipeline Compiler

#### Step 2.1: Create Pipeline Build Server

- **Goal**: Vite-based compiler that watches source files
- **Architecture**: Separate Vite instance for pipeline compilation
- **Output**: `temp/pipeline.js` - Self-contained pipeline functions

#### Step 2.2: Adapt File Discovery

- **Goal**: Use V1's glob patterns for pipeline compilation
- **Action**: Modify `scanForUserModels()` logic for build-time compilation
- **Output**: Compiled functions instead of runtime imports

#### Step 2.3: Handle Parametric Models

- **Goal**: Preserve parametric model functionality in compiled pipeline
- **Action**: Adapt V1's parametric detection and config extraction
- **Challenge**: Compile parametric configs into pipeline functions

### Phase 3: UI Harness

#### Step 3.1: Simple Pipeline Reload

- **Goal**: Replace complex HMR with simple pipeline replacement
- **Action**: Poll/watch for pipeline changes, reload entire pipeline
- **Benefit**: Avoids V1's HMR complexity issues

#### Step 3.2: State Preservation

- **Goal**: UI state survives pipeline reloads
- **Action**: Store model selection, parameters, camera position outside pipeline
- **Implementation**: URL params for model selection + local storage for config parameters

#### Step 3.3: Selective Re-rendering

- **Goal**: Only update model viewer, preserve UI state
- **Action**: Re-generate GLB with new pipeline + existing parameters
- **Benefit**: No full page reloads, smooth development experience

### Phase 4: Production Readiness

#### Step 4.1: Worker Migration

- **Goal**: Move pipeline execution to Web Workers
- **Action**: Same pipeline interface, different execution context
- **Benefit**: Non-blocking model generation

#### Step 4.2: Static Hosting

- **Goal**: Production builds work without servers
- **Action**: Bundle pipeline functions for client-side execution
- **Benefit**: Meets production hosting requirements

## Technical Implementation Details

### Pipeline Compiler Architecture

#### Dual Vite Setup

```bash
# Development workflow
npm run dev  # Starts both servers concurrently

# Pipeline Build Server (Port 3001)
├── Watches: main.ts, components/**/*.ts
├── Compiles: TypeScript → Pipeline Functions
├── Outputs: temp/pipeline.js, temp/manifest.json
└── Serves: Pipeline artifacts via HTTP

# UI Harness Server (Port 5173)
├── Watches: temp/pipeline.js changes
├── Imports: Pipeline dynamically with cache busting
├── Renders: Parameter UI + Model Viewer
└── Preserves: UI state across pipeline reloads
```

#### Pipeline Function Structure

```typescript
// temp/pipeline.js (compiled output)
export const pipeline = {
  getAvailableModels() {
    return [
      { id: "main", name: "Parametric Hook", type: "parametric" },
      { id: "components/wheel", name: "Wheel", type: "static" },
    ];
  },

  generateModel(modelId, params = {}) {
    switch (modelId) {
      case "main":
        return generateParametricHook(params);
      case "components/wheel":
        return generateWheel(params);
      default:
        throw new Error(`Unknown model: ${modelId}`);
    }
  },

  getModelConfig(modelId) {
    // Return parameter definitions for parametric models
    if (modelId === "main") {
      return {
        parameters: {
          height: { type: "number", value: 10, min: 1, max: 50 },
          // ...
        },
      };
    }
    return null;
  },
};

// Self-contained model generation functions
function generateParametricHook(params) {
  // Compiled from main.ts with inlined dependencies
  // Returns Manifold object
}

function generateWheel(params) {
  // Compiled from components/wheel.ts
  // Returns Manifold object
}
```

### UI Harness Implementation

#### Pipeline Reload Logic

```typescript
// packages/configurator/src/core/pipeline-loader.ts
export class PipelineLoader {
  private currentPipeline: ModelPipeline | null = null;
  private lastModified: string | null = null;

  async checkForUpdates(): Promise<boolean> {
    try {
      const response = await fetch("./temp/pipeline.js", { method: "HEAD" });
      const modified = response.headers.get("last-modified");

      if (modified !== this.lastModified) {
        await this.reloadPipeline();
        this.lastModified = modified;
        return true;
      }
      return false;
    } catch (error) {
      console.log("Pipeline not available:", error);
      return false;
    }
  }

  private async reloadPipeline(): Promise<void> {
    const timestamp = Date.now();
    const module = await import(`./temp/pipeline.js?t=${timestamp}`);
    this.currentPipeline = module.pipeline;
    console.log("✅ Pipeline reloaded");
  }

  getPipeline(): ModelPipeline | null {
    return this.currentPipeline;
  }
}
```

#### State Preservation

```typescript
// packages/configurator/src/state/ui-state.ts
export interface UIState {
  selectedModel: string | null;
  parameters: Record<string, any>;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
}

export class UIStateManager {
  private state: UIState = {
    selectedModel: null,
    parameters: {},
    cameraPosition: [0, 0, 5],
    cameraTarget: [0, 0, 0],
  };

  // Persist to URL and localStorage
  saveState(): void {
    const url = new URL(window.location.href);
    if (this.state.selectedModel) {
      url.searchParams.set("model", this.state.selectedModel);
    }
    window.history.replaceState({}, "", url.toString());

    localStorage.setItem("manifold-ui-state", JSON.stringify(this.state));
  }

  // Restore from URL and localStorage
  loadState(): void {
    const url = new URL(window.location.href);
    const modelFromUrl = url.searchParams.get("model");

    const savedState = localStorage.getItem("manifold-ui-state");
    if (savedState) {
      this.state = { ...this.state, ...JSON.parse(savedState) };
    }

    if (modelFromUrl) {
      this.state.selectedModel = modelFromUrl;
    }
  }
}
```

## Create-App Template Changes

### Current Template Structure (V1/V2)

```
packages/create-app/templates/basic/
├── main.ts                    # User's main model
├── components/                # User's component models
├── vite.config.ts            # Basic Vite config
├── package.json              # Basic dependencies
├── scripts/
│   └── model-watcher.ts      # V2 GLB compiler (broken for parametric)
└── README.md                 # Basic instructions
```

### V3 Template Changes Required

#### 1. **Dual Server Configuration**

```typescript
// vite.config.ts (NEW)
import { defineConfig } from "vite";

export default defineConfig({
  // UI Harness Server configuration
  server: {
    port: 5173,
    // Proxy pipeline requests to build server
    proxy: {
      "/temp": "http://localhost:3001",
    },
  },
  // ... existing config
});

// vite.pipeline.config.ts (NEW)
import { defineConfig } from "vite";

export default defineConfig({
  // Pipeline Build Server configuration
  build: {
    lib: {
      entry: "./temp/pipeline-entry.ts",
      name: "ModelPipeline",
      fileName: "pipeline",
      formats: ["es"],
    },
    outDir: "./temp",
    watch: {}, // Enable watch mode
  },
  server: {
    port: 3001,
  },
});
```

#### 2. **Updated Package Scripts**

```json
// package.json (MODIFIED)
{
  "scripts": {
    "dev": "concurrently \"npm run dev:pipeline\" \"npm run dev:ui\"",
    "dev:pipeline": "vite build --config vite.pipeline.config.ts --watch",
    "dev:ui": "vite --config vite.config.ts",
    "build": "npm run build:pipeline && npm run build:ui",
    "build:pipeline": "vite build --config vite.pipeline.config.ts",
    "build:ui": "vite build --config vite.config.ts"
  },
  "devDependencies": {
    "concurrently": "^8.0.0"
    // ... existing deps
  }
}
```

#### 3. **Pipeline Compiler Script**

```typescript
// scripts/pipeline-compiler.ts (NEW - replaces model-watcher.ts)
import { watch } from "chokidar";
import { buildPipeline } from "../src/pipeline-compiler/index.js";

// Watch source files and rebuild pipeline
const watcher = watch(["./main.ts", "./components/**/*.ts"], {
  ignored: /node_modules/,
  persistent: true,
});

watcher.on("change", async (path) => {
  console.log(`🔄 File changed: ${path}`);
  await buildPipeline();
  console.log("✅ Pipeline rebuilt");
});

// Initial build
await buildPipeline();
console.log("🚀 Pipeline compiler started");
```

#### 4. **Pipeline Compiler Implementation**

```typescript
// src/pipeline-compiler/index.ts (NEW)
export async function buildPipeline(): Promise<void> {
  // 1. Discover model files (adapted from V1)
  const models = await discoverModels();

  // 2. Compile each model to function
  const functions = await Promise.all(
    models.map((model) => compileModelToFunction(model))
  );

  // 3. Generate pipeline.js with switch statement
  const pipelineCode = generatePipelineCode(functions);

  // 4. Write to temp/pipeline.js
  await writeFile("./temp/pipeline.js", pipelineCode);

  // 5. Generate manifest.json
  const manifest = generateManifest(models);
  await writeFile("./temp/manifest.json", JSON.stringify(manifest, null, 2));
}
```

#### 5. **Template File Changes**

```typescript
// main.ts (EXAMPLE - shows V3 compatibility)
import { createConfig } from "@manifold-studio/wrapper";

// V3: Same as V1/V2 - no changes needed for user code
export default createConfig({
  name: "Parametric Hook",
  parameters: {
    height: { type: "number", value: 10, min: 1, max: 50 },
    width: { type: "number", value: 5, min: 1, max: 20 },
  },
  generateModel: (params) => {
    // User's model generation logic
    return manifold;
  },
});
```

#### 6. **Updated README**

````markdown
# V3 Development Workflow (NEW INSTRUCTIONS)

## Quick Start

```bash
npm run dev  # Starts both pipeline compiler + UI harness
```
````

This starts:

- **Pipeline Compiler** (Port 3001): Watches your models, compiles to functions
- **UI Harness** (Port 5173): Loads pipeline, provides parameter controls

## Development

1. Edit `main.ts` or files in `components/`
2. Pipeline automatically recompiles
3. UI automatically reloads pipeline
4. Model viewer updates with your changes
5. **Parametric models work!** - Real-time parameter updates

## What's Different from V2

- ✅ **Parametric models work**: Real-time parameter updates
- ✅ **Reliable updates**: No more cache/import issues
- ✅ **State preservation**: UI state survives model changes
- ✅ **Simple workflow**: Just `npm run dev`

```

### Migration from V2 Templates

#### Files to Add
- `vite.pipeline.config.ts` - Pipeline build configuration
- `scripts/pipeline-compiler.ts` - Replaces `model-watcher.ts`
- `src/pipeline-compiler/` - Pipeline compilation logic

#### Files to Modify
- `vite.config.ts` - Add proxy configuration
- `package.json` - Update scripts for dual server
- `README.md` - Update instructions for V3 workflow

#### Files to Remove
- `scripts/model-watcher.ts` - Replaced by pipeline compiler
- Any V2-specific GLB compilation scripts

## File Structure

```

packages/
├── configurator/
│ ├── src/
│ │ ├── types/ # Salvaged from V1
│ │ │ ├── model.ts
│ │ │ ├── pipeline.ts
│ │ │ └── service.ts
│ │ ├── utils/ # Salvaged from V1
│ │ │ ├── model-detection.ts
│ │ │ └── path-utils.ts
│ │ ├── core/
│ │ │ ├── pipeline-loader.ts # New
│ │ │ └── model-renderer.ts # New
│ │ ├── state/
│ │ │ ├── ui-state.ts # New
│ │ │ └── store.ts # Modified
│ │ └── services/
│ │ └── ModelService.ts # Simplified
│ └── temp/ # Pipeline output
│ ├── pipeline.js # Compiled functions
│ └── manifest.json # Model metadata
│
└── create-app/
├── templates/basic/
│ ├── scripts/
│ │ └── pipeline-compiler.ts # NEW (replaces model-watcher.ts)
│ ├── vite.config.ts # MODIFIED (proxy config)
│ ├── vite.pipeline.config.ts # NEW (pipeline build)
│ ├── package.json # MODIFIED (dual server scripts)
│ └── README.md # MODIFIED (V3 instructions)
└── src/
└── pipeline-compiler/ # NEW
├── index.ts # Main compiler logic
├── file-discovery.ts # Adapted from V1
├── model-compiler.ts # Model → Function compilation
└── function-generator.ts # Pipeline code generation

```

## Next Steps

1. **Phase 1.1**: Extract V1 types and utilities
2. **Phase 1.2**: Create pipeline interfaces
3. **Phase 2.1**: Build pipeline compiler prototype
4. **Phase 2.2**: Test with simple static model
5. **Phase 2.3**: Add parametric model support
6. **Phase 3.1**: Implement UI harness with pipeline reload
7. **Phase 3.2**: Add state preservation
8. **Phase 4**: Production optimization (workers, bundling)

## Success Criteria

- ✅ **Reliable HMR**: No more V1 cache/import issues
- ✅ **Parametric models work**: Real-time parameter updates
- ✅ **State preservation**: UI state survives pipeline reloads
- ✅ **Production ready**: Static hosting compatible
- ✅ **Developer experience**: Simple `npm run dev` workflow
- ✅ **Code reuse**: 70% of V1 logic salvaged and improved
```
