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
  if (await fileExists('main.ts') || await fileExists('main.js')) {
    models.push('main');
  }
  
  // 4. Scan components directory
  const componentFiles = await scanDirectory('components/');
  models.push(...componentFiles);
  
  // 5. Scan for other .ts/.js files (assemblies, etc.)
  const otherFiles = await scanDirectory('./', { 
    exclude: ['main.ts', 'main.js', 'components/', 'node_modules/'] 
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
const modelModules = import.meta.glob([
  './main.{ts,js}',
  './components/**/*.{ts,js}',
  './**/*.{ts,js}'
], { 
  exclude: ['./node_modules/**', './dist/**'],
  eager: false 
});

export async function getAvailableModelsAsync(): Promise<string[]> {
  if (isDevelopmentMode()) {
    return developmentModels;
  }
  
  // Extract model names from file paths
  const modelPaths = Object.keys(modelModules);
  return modelPaths.map(path => {
    // Convert './components/wheel.ts' -> 'wheel'
    // Convert './main.ts' -> 'main'
    return extractModelName(path);
  });
}
```

## Implementation Phases

### Phase 1: Basic Directory Scanning
- Implement `scanForUserModels()` with hardcoded paths
- Support `main.ts` and `components/*.ts`
- Test with generated projects

### Phase 2: Vite Integration
- Integrate `import.meta.glob()` for build-time discovery
- Handle file path normalization
- Ensure HMR updates model list

### Phase 3: Advanced Features
- Support nested directories
- Handle TypeScript vs JavaScript files
- Add model metadata extraction (names, descriptions)
- Support for model categories/grouping

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
  return window.location.pathname.includes('/packages/configurator') ||
         import.meta.env.DEV && import.meta.env.VITE_MONOREPO_MODE;
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
  import.meta.hot.on('vite:afterUpdate', () => {
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

1. **Implement Phase 1** - Basic directory scanning
2. **Test with generated projects** - Verify discovery works
3. **Add Vite integration** - Use `import.meta.glob()`
4. **Update model selector UI** - Handle dynamic model lists
5. **Add comprehensive testing** - Unit and integration tests

This implementation will complete the scaffolding system by making generated projects fully self-contained with automatic component discovery.
