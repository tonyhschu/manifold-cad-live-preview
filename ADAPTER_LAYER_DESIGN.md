# Adapter Layer Design

## Overview

The adapter layer provides clean separation between the ManifoldCAD core library and UI components, enabling future library extraction while maintaining clean interfaces.

## Architecture

```
src/
├── lib/                    # Future NPM package (pure library)
│   ├── manifold.ts        # Core operations
│   ├── export/            # Export functionality
│   │   ├── obj.ts         # OBJ export
│   │   ├── gltf.ts        # GLB export
│   │   ├── threemf.ts     # Future 3MF export
│   │   └── index.ts       # Export format registry
│   └── index.ts           # Main library exports
├── services/              # UI adapter layer
│   ├── interfaces.ts      # Service contracts
│   ├── ServiceContainer.ts # Dependency injection
│   ├── ModelService.ts    # Model operations adapter
│   ├── ExportService.ts   # Export operations adapter
│   ├── UrlService.ts      # Browser URL management
│   └── index.ts           # Service exports
├── state/
│   ├── store.ts          # Pure state management
│   └── actions.ts        # State update actions
└── components/           # Web Components (consume services)
```

## Design Principles

### 1. Library Purity (`src/lib/`)
- **No UI dependencies**: No DOM access, console logs, or browser APIs
- **Environment agnostic**: Works in Node.js and browsers
- **Pure functions**: Deterministic operations without side effects
- **Clear API boundaries**: Well-defined public interfaces

### 2. Service Adaptation (`src/services/`)
- **Bridge layer**: Translates between library and UI concerns
- **Browser integration**: Handles URLs, progress callbacks, error handling
- **Event-driven**: Loose coupling through events
- **Testable**: Clean interfaces enable easy mocking

### 3. State Management (`src/state/`)
- **Pure state**: Only signal management, no business logic
- **Reactive**: Uses Preact Signals for reactivity
- **Service-driven**: Actions delegate to services

## Service Responsibilities

### ModelService
- **Model loading**: Orchestrates model loading with progress
- **Caching**: Manages model cache for performance
- **Error handling**: Provides user-friendly error messages
- **Progress tracking**: Reports loading progress to UI

```typescript
interface IModelService {
  loadModel(id: string, onProgress?: ProgressCallback): Promise<ModelLoadResult>;
  getAvailableModels(): ModelInfo[];
  getCachedModel(id: string): Manifold | null;
}
```

### ExportService
- **Format management**: Registry of supported export formats
- **Export orchestration**: Handles export with progress tracking
- **URL generation**: Creates downloadable URLs for exports
- **Multi-format support**: Extensible for new formats (3MF, STL, etc.)

```typescript
interface IExportService {
  getSupportedFormats(): ExportFormat[];
  exportModel(model: Manifold, format: string): Promise<ExportResult>;
  exportToOBJ(model: Manifold): Promise<ExportResult>;
  exportToGLB(model: Manifold): Promise<ExportResult>;
}
```

### UrlService
- **Blob URL management**: Creates and tracks object URLs
- **Resource cleanup**: Prevents memory leaks
- **Filename generation**: Creates timestamped filenames
- **Browser abstraction**: Encapsulates URL/Blob APIs

```typescript
interface IUrlService {
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
  generateFilename(base: string, ext: string): string;
}
```

## Export Format Architecture

### Library Side (`src/lib/export/`)
```typescript
// Pure export functions (no browser dependencies)
export interface ExportFunction {
  (model: Manifold): Uint8Array | string;
}

export const formats = {
  obj: { name: 'OBJ', extension: 'obj', export: exportToOBJ },
  glb: { name: 'GLB', extension: 'glb', export: exportToGLB },
  // Future: threemf, stl, etc.
};
```

### Service Side (`src/services/ExportService.ts`)
```typescript
// UI integration (progress, URLs, error handling)
class ExportService {
  async exportModel(model: Manifold, formatId: string): Promise<ExportResult> {
    // 1. Get format from library
    // 2. Call library export function
    // 3. Create blob and URL
    // 4. Return UI-friendly result
  }
}
```

## Event System

Services emit events for loose coupling:

```typescript
// Service events
'model:loading' -> { modelId: string }
'model:loaded' -> { modelId: string, model: Manifold }
'export:progress' -> { progress: number, message: string }
'export:completed' -> { result: ExportResult }
```

Components listen to events:
```typescript
// In Web Component
connectedCallback() {
  services.on('model:loaded', this.handleModelLoaded);
}
```

## Migration Strategy

1. **Create service interfaces** ✓
2. **Implement UrlService** (simplest, no dependencies)
3. **Implement ExportService** (delegates to lib, uses UrlService)
4. **Implement ModelService** (uses ExportService)
5. **Refactor store** (remove business logic, keep state)
6. **Update components** (use services instead of store actions)
7. **Clean up library** (remove UI dependencies)

## Benefits

### Immediate
- ✅ Clear separation of concerns
- ✅ Better testability
- ✅ Easier to add new export formats
- ✅ Reduced coupling between layers

### Future
- ✅ Clean library extraction
- ✅ Reusable services across projects
- ✅ Better error handling and user experience
- ✅ Support for headless/CLI usage

## Testing Strategy

```typescript
// Mock services for component testing
const mockModelService = {
  loadModel: jest.fn().mockResolvedValue(mockResult),
  // ...
};

// Test service implementations independently
describe('ExportService', () => {
  it('should export model to OBJ format', async () => {
    // ...
  });
});
```

This design enables clean separation while preparing for future library extraction and multi-format export support.