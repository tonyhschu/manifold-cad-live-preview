# Model Discovery System Implementation Plan

## Overview

The `getAvailableModelsAsync()` function is currently a stub that returns hardcoded development models. This document outlines the plan to implement a robust model discovery system that automatically finds and loads models from user projects.

## Use Case Context

### Primary Use Case: Component Modularization

Any project of sufficient complexity benefits from modularization. The model discovery system makes it easier for users to:

1. **Break down complex models** into smaller, reusable components
2. **View different sub-modules** independently during development
3. **Organize code** in a logical directory structure
4. **Share components** between different main models

### User Workflow

```
my-project/
├── main.ts              # Primary model with parametric controls
├── components/          # Reusable components
│   ├── wheel.ts         # Individual wheel component
│   ├── chassis.ts       # Car chassis component
│   └── engine.ts        # Engine assembly
└── assemblies/          # Complex assemblies
    ├── front-axle.ts    # Front axle with wheels
    └── drivetrain.ts    # Engine + transmission
```

**Expected behavior:**

- Model selector shows: `main`, `wheel`, `chassis`, `engine`, `front-axle`, `drivetrain`
- User can select any component to view it in isolation
- Parameter controls adapt to the selected model
- HMR works for all discovered models

## Current Implementation

```typescript
// packages/configurator/src/core/model-loader.ts
export async function getAvailableModelsAsync(): Promise<string[]> {
  // TODO: Implement actual directory scanning for generated projects
  return developmentModels; // Hardcoded list
}
```

**Issues:**

- Only works with hardcoded development models
- No directory scanning for user projects
- No convention-based discovery
- No support for nested directories

## Proposed Implementation

### Convention-Based Discovery

Follow the established convention from the create-app templates:

1. **Main model**: `main.ts` (or `main.js`) - primary entry point
2. **Components**: `components/*.ts` - individual reusable components
3. **Assemblies**: Any other `.ts` files in the project root or subdirectories

### Detection Strategy

```typescript
export async function getAvailableModelsAsync(): Promise<string[]> {
  // 1. Detect environment (development vs generated project)
  if (isDevelopmentMode()) {
    return developmentModels; // Current behavior for monorepo
  }

  // 2. Scan for model files in generated projects
  return await scanForUserModels();
}

async function scanForUserModels(): Promise<string[]> {
  const models: string[] = [];

  // 3. Look for main.ts/main.js
  if ((await fileExists("main.ts")) || (await fileExists("main.js"))) {
    models.push("main");
  }

  // 4. Scan components directory
  const componentFiles = await scanDirectory("components/");
  models.push(...componentFiles);

  // 5. Scan for other .ts/.js files (assemblies, etc.)
  const otherFiles = await scanDirectory("./", {
    exclude: ["main.ts", "main.js", "components/", "node_modules/"],
  });
  models.push(...otherFiles);

  return models;
}
```

### File System Access

**Challenge**: Browser environment cannot directly access file system.

**Solutions:**

1. **Vite Integration** (Recommended)

   - Use Vite's `import.meta.glob()` to discover files at build time
   - Generate a manifest of available models
   - Update manifest on file changes via HMR

2. **Dynamic Import Discovery**

   - Attempt to dynamically import expected file paths
   - Catch errors for non-existent files
   - Build model list from successful imports

3. **Build-Time Generation**
   - Generate a `models.json` manifest during build
   - Include all discovered model files
   - Update via file watcher

### Recommended Approach: Vite Integration

```typescript
// Use Vite's glob import to discover models at build time
const modelModules = import.meta.glob(
  ["./main.{ts,js}", "./components/**/*.{ts,js}", "./**/*.{ts,js}"],
  {
    exclude: ["./node_modules/**", "./dist/**"],
    eager: false,
  }
);

export async function getAvailableModelsAsync(): Promise<string[]> {
  if (isDevelopmentMode()) {
    return developmentModels;
  }

  // Extract model names from file paths
  const modelPaths = Object.keys(modelModules);
  return modelPaths.map((path) => {
    // Convert './components/wheel.ts' -> 'wheel'
    // Convert './main.ts' -> 'main'
    return extractModelName(path);
  });
}
```

## Implementation Phases

### ✅ Phase 1: Basic Directory Scanning - COMPLETE

- ✅ Implemented configuration-driven model discovery
- ✅ Integrated `import.meta.glob()` for build-time discovery
- ✅ Support `main.ts`, `components/*.ts`, and `assemblies/*.ts`
- ✅ Full path model IDs to prevent collisions (e.g., `components/wheel`)
- ✅ Customer-first architecture with model registry pattern
- ✅ Basic HMR support for file addition/removal/modification
- ✅ Tested with generated projects

### Phase 2: Enhanced Model Metadata

- Add automatic model type detection (static vs parametric)
- Extract model names and descriptions from exports
- Support for model categories/grouping
- Handle TypeScript vs JavaScript files gracefully

### Phase 3: Advanced Features

- Support nested directories beyond components/assemblies
- Model dependency tracking and visualization
- Performance optimization for large projects
- Advanced HMR with granular component updates

### Phase 4: Error Handling & UX

- Graceful handling of malformed models
- Loading states in model selector
- Error messages for failed model loads
- Model validation and type checking

## Technical Considerations

### Environment Detection

```typescript
function isDevelopmentMode(): boolean {
  // Check if we're in the monorepo development environment
  return (
    window.location.pathname.includes("/packages/configurator") ||
    (import.meta.env.DEV && import.meta.env.VITE_MONOREPO_MODE)
  );
}
```

### Model Loading Integration

The discovery system must integrate with existing model loading:

```typescript
// Current: loadModel(modelId: string)
// Must work with discovered model IDs

export async function loadModel(modelId: string): Promise<void> {
  // 1. Check if model exists in discovered list
  const availableModels = await getAvailableModelsAsync();
  if (!availableModels.includes(modelId)) {
    throw new Error(`Model "${modelId}" not found`);
  }

  // 2. Determine file path from model ID
  const filePath = resolveModelPath(modelId);

  // 3. Dynamic import and load
  const module = await import(filePath);
  // ... existing loading logic
}
```

### HMR Integration

Model discovery must work with HMR:

```typescript
// Update model list when files are added/removed
if (import.meta.hot) {
  import.meta.hot.on("vite:afterUpdate", () => {
    // Refresh available models list
    refreshModelSelector();
  });
}
```

## Testing Strategy

### Unit Tests

- Test model path resolution
- Test file name extraction
- Test environment detection

### Integration Tests

- Test with actual generated projects
- Test HMR model discovery updates
- Test error handling for missing files

### Manual Testing

- Generate test project with multiple components
- Verify all models appear in selector
- Test model loading and parameter controls
- Verify HMR updates model list

## Success Criteria

1. ✅ **Generated projects automatically discover models**
2. ✅ **Model selector shows all available models**
3. ✅ **HMR updates model list when files change**
4. ✅ **Works with both TypeScript and JavaScript files**
5. ✅ **Graceful error handling for malformed models**
6. ✅ **Maintains backward compatibility with development mode**

## Next Steps

1. **Phase 2 Implementation** - Enhanced model metadata and type detection
2. **Update create-app templates** - Use new model discovery by default
3. **Resolve HMR architectural issues** - See HMR Considerations below
4. **Add comprehensive testing** - Unit and integration tests for discovery system
5. **Documentation** - Update README with new model discovery workflow

## HMR Considerations

### Current Status

✅ **Basic HMR working** - File addition/removal/modification triggers model list updates
✅ **Architecture redesigned** - Two-watcher system implemented

### New HMR Architecture

The HMR system now uses **two independent watchers within a single Vite process**:

#### 1. User Project Watcher (Always Active)

**Purpose**: Watch for changes in user model files
**Scope**:

- `./main.{ts,js}` - Main model file
- `./components/**/*.{ts,js}` - Component models

**Behavior**:

- Triggers model viewer refresh + registry update
- Preserves UI state (camera position, parameter values)
- Only updates the `<model-viewer>` component, not full page
- Active in both monorepo development and user projects

#### 2. Monorepo Watcher (Conditional - REPO_HMR flag)

**Purpose**: Watch for changes in core framework packages
**Scope**:

- `packages/wrapper/src/**` - Wrapper package source
- `packages/configurator/src/**` - Configurator package source

**Behavior**:

- Triggers full page reload (framework changes require complete refresh)
- Only active when `REPO_HMR=true` environment variable is set
- Used during framework development with `npm run devAll`

### Implementation Details

```typescript
if (import.meta.hot) {
  // User project watcher (always active)
  import.meta.hot.accept(
    ["./main.{ts,js}", "./components/**/*.{ts,js}"],
    (modules) => {
      console.log("🔄 User models changed");
      refreshModelViewer(); // Granular update
    }
  );

  // Monorepo watcher (conditional)
  if (import.meta.env.VITE_REPO_HMR) {
    import.meta.hot.accept(
      ["../packages/wrapper/src/**", "../packages/configurator/src/**"],
      () => {
        console.log("🔄 Core packages changed");
        window.location.reload(); // Full refresh
      }
    );
  }
}
```

### Development Commands

- **`npm run devAll`**: Starts with `REPO_HMR=true` for framework development
- **`npm run dev`** (in user projects): Only user project watcher active
- **Both can run simultaneously**: Framework and user project development in parallel

### Benefits

1. **Clean separation**: Framework development vs. user model development
2. **Appropriate refresh scope**: Full reload for framework, granular for models
3. **State preservation**: Camera position and parameters maintained during model updates
4. **Parallel development**: Can develop framework and models simultaneously
5. **Single process**: No complex multi-process coordination needed

This implementation will complete the scaffolding system by making generated projects fully self-contained with automatic component discovery.
