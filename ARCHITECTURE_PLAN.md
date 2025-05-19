# ManifoldCAD Developer Experience Improvement Plan

## Current State

The current implementation mixes two distinct concerns:
1. Core CSG modeling logic (defining what to build)
2. UI preview scaffolding (how to display it)

This makes it harder for developers to focus on the modeling aspects.

## Proposed Architecture

We can greatly improve the developer experience by separating these concerns:

### Goals
- Allow developers to focus only on their CSG modeling code
- Provide automatic hot-reloading preview
- Support modular imports and composition
- Handle UI/preview concerns automatically

## Implementation Plan

### 1. Create a Preview Framework

Build a framework that:
- Automatically imports user's modeling code
- Handles preview rendering
- Manages the hot-reload lifecycle

### 2. Define Clear Module Contract

User modules should:
- Export a default async function that returns a Manifold object
- Have access to all utilities via imports
- Be able to import other modeling modules
- Not need to worry about UI concerns

### 3. Structure

```
src/
├── core/               # Framework core (not modified by users)
│   ├── preview.ts      # Preview system 
│   ├── renderer.ts     # Handles model-viewer setup
│   ├── hot-reload.ts   # Hot reload manager
│   └── export.ts       # Export utilities (OBJ, GLB)
│
├── lib/                # Same utilities as now
│   ├── manifold-context.ts
│   ├── utilities.ts
│   ├── gltf-export.ts
│   └── manifold-gltf.ts
│
├── models/             # Where users write their code
│   ├── index.ts        # Main entry point for models
│   ├── basic-shapes.ts # Example model module
│   └── custom/         # Users can organize as needed
│
└── main.ts             # Simplified to just bootstrap the preview
```

### 4. Integration with Vite

Vite's hot module replacement (HMR) can be leveraged to:
- Detect changes in the model files
- Trigger re-rendering of the preview
- Maintain UI state during development

### 5. Example Usage

A user would write model code like:

```typescript
// models/my-model.ts
import { cube, cylinder, union } from "../lib/utilities";

export default async function createModel() {
  // Create shapes
  const shape1 = await cube([10, 10, 10]);
  const shape2 = await cylinder(5, 15, 32);
  
  // Combine and return
  return union([shape1, shape2]);
}
```

The preview environment would:
1. Import this module
2. Execute the function
3. Render the result
4. Handle exports/downloads
5. Update on any code changes

## Implementation Steps

1. **Create Core Preview System**
   - Implement the preview manager that loads models
   - Set up model-viewer configuration

2. **Set Up Hot Reload Integration**
   - Configure Vite HMR for model files
   - Implement reload handlers

3. **Create Module Contract**
   - Define and document the expected module format
   - Create helper utilities for common patterns

4. **Build Example Models**
   - Port current demo to the new format
   - Create additional examples

5. **Documentation**
   - Create documentation for users
   - Document extension points

This approach allows developers to think purely in terms of their CSG modeling, while the framework handles all the preview functionality automatically.