# Model Watcher V3: Pipeline-Based Architecture

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

### ✅ **What's Working**

- **Pipeline Compiler** - Compiles models to `temp/pipeline.js`
- **Dual Vite Architecture** - Pipeline build server + UI server
- **Model Discovery** - Finds `main.ts` and `components/*.ts`
- **Parameter Extraction** - Extracts configs from parametric models
- **Basic V3 Configurator** - Test harness with pipeline integration
- **NPM Link Development** - Auto-rebuild libraries + test project

### 🔄 **What Needs Completion**

- **Clean Configurator Library** - Rebuild as pure library with `startConfigurator()`
- **Manifest Generation** - Structured metadata in `temp/manifest.json`
- **Full UI Integration** - 3D viewer, parameter panels, export functionality
- **Create-App Templates** - Update with V3 dual-server setup

## Updated Implementation Plan

Based on our current progress and refined architecture understanding:

### ✅ **Already Complete**

- **Pipeline Compiler** - Working dual Vite architecture with model compilation
- **Basic V3 Integration** - Test harness proves V3 pipeline system works
- **Development Workflow** - Auto-rebuild libraries + hot reload pipeline
- **Model Discovery & Compilation** - Finds and compiles `main.ts` + `components/*.ts`

### 🎯 **Immediate Priorities**

1. **Clean Configurator Library** - Remove standalone app, implement `startConfigurator()`
2. **Manifest Generation** - Add structured `temp/manifest.json` alongside pipeline
3. **Full UI Integration** - 3D viewer, parameter panels, export functionality
4. **Create-App Templates** - Update with working V3 setup

## Technical Implementation Details

### Dual Vite Architecture

```bash
# Development workflow
npm run dev  # Starts both servers concurrently

# Pipeline Build Server (Vite Process #1)
├── Config: vite.pipeline.config.ts
├── Watches: main.ts, components/**/*.ts
├── Compiles: TypeScript → Pipeline Functions
├── Outputs: temp/pipeline.js, temp/manifest.json
└── Mode: vite build --watch

# UI Server (Vite Process #2)
├── Config: vite.config.ts
├── Serves: User project HTML + configurator library + pipeline artifacts
├── Provides: Standard Vite dev server with HMR
└── Mode: vite (dev server)
```

### Pipeline Artifacts

#### Pipeline Library (`temp/pipeline.js`)

Self-contained JavaScript module that can execute models:

```typescript
export const pipeline = {
  getAvailableModels(): ModelConfig[] {
    return [
      { id: "main", name: "V3 Test Hook", type: "parametric" },
      { id: "components/wheel", name: "Wheel", type: "static" },
    ];
  },

  generateModel(modelId: string, params: any = {}): Manifold {
    // Execute the specific model with parameters
    // Returns Manifold object for GLB conversion
  },

  getModelConfig(modelId: string): ParametricConfig | null {
    // Return parameter schema for parametric models
  },
};
```

#### Manifest (`temp/manifest.json`)

Structured metadata about available models:

```json
{
  "models": [
    {
      "id": "main",
      "name": "V3 Test Hook",
      "type": "parametric",
      "config": {
        "parameters": {
          "height": { "type": "number", "value": 10, "min": 1, "max": 50 }
        }
      }
    }
  ]
}
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

### Configurator Library Interface

#### User Project Integration

**Minimal User Code**: The configurator library handles all coordination logic internally, keeping user projects as simple as possible.

```typescript
// User project main.ts (minimal - just one function call)
import { startConfigurator } from "@manifold-studio/configurator";

// All coordination logic happens inside the library
const configurator = await startConfigurator({
  container: "#app",
  pipelinePath: "/temp/pipeline.js",
  manifestPath: "/temp/manifest.json",
  defaultModel: "main",
});
```

**What `startConfigurator()` Does Internally:**

1. **Initialize Manifold** - Makes Manifold/CrossSection available globally
2. **Set up V3 pipeline system** - Creates and initializes V3ModelService
3. **Initialize services** - ModelService, ExportService, UrlService, etc.
4. **Initialize state management** - Store, UI state, event system
5. **Load pipeline** - Fetch and parse pipeline + manifest
6. **Set up UI components** - Model viewer, parameter panels, etc.
7. **Load default model** - Execute pipeline with default parameters
8. **Error handling** - Graceful degradation for failures

#### Configurator Options

```typescript
interface ConfiguratorOptions {
  container: string | HTMLElement;
  pipelinePath?: string; // Default: '/temp/pipeline.js'
  manifestPath?: string; // Default: '/temp/manifest.json'
  defaultModel?: string; // Default: first available model
  onConfigChange?: (modelId: string, config: any) => void;
  onModelLoad?: (modelId: string, glb: Blob) => void;
  onError?: (error: Error) => void;
}
```

#### Configurator Internal Architecture

**Coordination Logic Location**: All complex initialization and coordination logic lives inside the configurator library, not in user projects.

```
packages/configurator/src/
├── index.ts                    # Main export: startConfigurator()
├── core/
│   ├── coordinator.ts          # Main coordination logic (from old main.ts)
│   ├── pipeline-loader.ts      # Pipeline loading and hot-reload
│   └── model-renderer.ts       # GLB generation and rendering
├── components/                 # UI components (model-viewer, panels)
├── services/                   # Service initialization and management
└── state/                      # State management and event system
```

**Benefits of This Design:**

- ✅ **User projects stay minimal** - Just one `startConfigurator()` call
- ✅ **Library owns complexity** - All coordination logic internal to configurator
- ✅ **Easy maintenance** - Changes don't require user project updates
- ✅ **Consistent behavior** - All user projects get same initialization
- ✅ **Better testing** - Can unit test coordination logic in isolation

### Hot Reload Implementation

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

## Complete Development Workflow

### User Experience

1. **Create Project**: `npx @manifold-studio/create-app my-project`
2. **Start Development**: `cd my-project && npm run dev`
3. **Edit Models**: Modify `main.ts` or `components/*.ts`
4. **See Changes**: Pipeline rebuilds → UI reloads → GLB updates automatically

### Behind the Scenes

```
File Change → Pipeline Compiler → Pipeline + Manifest → UI Detects Change → Reload Models → Execute Pipeline → Update GLB → Render in Viewer
```

**Step by Step:**

1. **User edits** `main.ts` (changes parameter default value)
2. **Pipeline Compiler** detects file change via Vite watcher
3. **Pipeline rebuilds** `temp/pipeline.js` with new default
4. **Configurator** detects pipeline change via polling/file watcher
5. **Model list reloads** from new pipeline metadata
6. **Current model re-executes** with existing UI parameters
7. **New GLB generated** and sent to model-viewer
8. **3D view updates** with new model, UI state preserved

### Error Handling

- **Pipeline compilation errors** → Show in status bar
- **Model execution errors** → Show in viewer area
- **Pipeline loading errors** → Graceful degradation
- **Network errors** → Retry with exponential backoff

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

**User's Model Files (No Change):**

```typescript
// main.ts - User's model code stays the same
import { createConfig } from "@manifold-studio/wrapper";

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

**User's UI Entry Point (Minimal):**

```typescript
// src/main.ts - Minimal coordination code
import { startConfigurator } from "@manifold-studio/configurator";

// All complexity handled by library
await startConfigurator({
  container: "#app",
  pipelinePath: "/temp/pipeline.js",
  defaultModel: "main",
});
```

**User's HTML (Simple):**

```html
<!-- index.html - Just a container -->
<!DOCTYPE html>
<html>
  <head>
    <title>My 3D Models</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

#### 6. **User Experience**

**Simple Development Workflow:**

```bash
# User creates project
npx @manifold-studio/create-app my-project
cd my-project

# User starts development
npm run dev  # Starts pipeline compiler + UI server

# User edits models
# → Pipeline rebuilds → UI reloads → GLB updates automatically
```

**What Users Get:**

- ✅ **Parametric models work** - Real-time parameter updates
- ✅ **Reliable hot reload** - No cache/import issues
- ✅ **State preservation** - UI state survives model changes
- ✅ **Simple workflow** - Just `npm run dev`

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

### Phase 1: Complete V3 Configurator Library ⚡ **PRIORITY**

1. **Remove standalone app complexity** - Simplify to library-only build
2. **Move coordination logic** from old `main.ts` to `core/coordinator.ts`
3. **Implement `startConfigurator()`** - Single function that handles all initialization
4. **Rebuild 12 modules** with clean event-based architecture:
   - State management (model selection, config UI)
   - Pipeline execution (GLB generation)
   - UI renderers (model list, parameter panels, 3D viewer)
   - Supporting modules (pipeline loader, export, error handling, etc.)
5. **Test integration** with existing V3 pipeline in `test-v3-development`

### Phase 2: Pipeline Enhancements

1. **Generate `manifest.json`** - Structured metadata alongside `pipeline.js`
2. **Improve error handling** - Better compilation and runtime error messages
3. **Hot reload optimization** - Faster pipeline rebuilds and detection
4. **Source maps** - Debug support for compiled pipeline

### Phase 3: Create-App Integration

1. **Update templates** with V3 dual-server setup and minimal user code
2. **Copy working V3 configs** from `test-v3-development` to templates
3. **Test scaffolding workflow** - `create-app` → `npm run dev` → edit models
4. **Update documentation** - V3 workflow and development guide

### Phase 4: Production & Polish

1. **Web Worker support** - Non-blocking pipeline execution
2. **Static hosting optimization** - Bundle for client-side execution
3. **Performance monitoring** - Build times, GLB generation speed
4. **Advanced features** - Export formats, debugging tools, analytics

```

```
