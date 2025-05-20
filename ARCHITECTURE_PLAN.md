# ManifoldCAD Developer Experience Improvement Plan

## Current Architecture

The ManifoldCAD preview environment separates concerns between:

1. Core modeling logic (what to build)
2. UI preview scaffolding (how to display it)

This allows developers to focus solely on their modeling code.

## Key Components

### Core Structure

```
src/
├── core/               # Framework core (not modified by users)
│   ├── preview.ts      # Preview system 
│   └── model-loader.ts # Model loading functionality
│
├── lib/                # Core libraries
│   ├── manifold.ts     # Synchronous ManifoldCAD API
│   ├── export.ts       # Export utilities
│   ├── gltf-export.ts  # GLB/glTF export functionality
│   └── manifold-gltf.ts # GLB extension for ManifoldCAD
│
├── models/             # Where users write their code
│   ├── demo.ts         # Example model
│   ├── cube.ts         # Simple model example
│   ├── compound.ts     # Example using components
│   └── components/     # Reusable model components
│
└── main.ts             # Bootstrap file for the preview
```

### Key Features

1. **Synchronous Modeling API**
   - Uses top-level await to initialize the WASM module once
   - Provides a clean API with no async/await needed in model code
   - Makes model code more readable and natural

2. **Model System**
   - Clear module contract for defining models
   - Simple export pattern: default export function
   - Metadata support for documentation

3. **Component Reuse**
   - Library of reusable modeling components
   - Easy composition of complex models

4. **Development Experience**
   - Model selector in the UI
   - Live preview of models
   - Download options (OBJ/GLB)

## Implementation Notes

### Synchronous API

The system uses top-level await to initialize the ManifoldCAD WASM module once during application startup. After initialization, all modeling operations are synchronous. This means:

1. Clean, readable model code without async/await
2. Natural composition of operations
3. Single initialization point for the WASM module

### Model Contract

Each model file follows a simple structure:

```typescript
// Default export function that returns a Manifold object
export default function createModel() {
  // Create and return a 3D model
  return someModel;
}

// Optional metadata about the model
export const modelMetadata = {
  name: "Model Name",
  description: "Description of the model",
  author: "Author name",
  version: "1.0.0"
};
```

This consistent contract makes it easy to add new models to the system.

### Future Enhancements

1. **Hot Reload Integration**
   - Integrate with Vite's HMR for live model reloading
   - Preserve camera position on reload
   - Add status indicators for reload events

2. **Expanded Component Library**
   - Add more reusable components
   - Create specialized component collections
   - Support parameterized models