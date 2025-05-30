# Scripts Directory

This directory contains build and pipeline scripts for the ManifoldCAD project.

## Architecture Overview

Our project uses a **dual-compilation strategy** to support both browser and Node.js environments:

```
Development Environment          Pipeline Environment
┌─────────────────────┐         ┌─────────────────────┐
│                     │         │                     │
│  npm run dev        │         │  npm run pipeline   │
│  ┌─────────────────┐│         │ ┌─────────────────┐ │
│  │ Vite Dev Server ││         │ │ Vite Build API  │ │
│  │                 ││         │ │                 │ │
│  │ TypeScript      ││         │ │ TypeScript      │ │
│  │ Hot Reload      ││         │ │ Library Mode    │ │
│  │ Browser Target  ││         │ │ Node.js Target  │ │
│  └─────────────────┘│         │ └─────────────────┘ │
└─────────────────────┘         └─────────────────────┘
          │                               │
          └─────── Same TypeScript ───────┘
```

## Core Scripts

### `pipeline.ts` ⭐ **Main Pipeline**
Modern TypeScript pipeline with just-in-time compilation:
- Pure TypeScript implementation
- Uses Vite for just-in-time compilation of all dependencies
- No manual pre-compilation required
- Supports both parametric and function-based models
- Full parameter override support

**Usage:**
```bash
npm run pipeline src/models/cube.ts --params size=25
node scripts/run-pipeline.js src/models/hook.ts --params thickness=5,width=20
```

### `run-pipeline.js`
Bootstrap script that compiles and runs the TypeScript pipeline using Vite.

## Environment Separation

### Browser Environment
- **Compilation:** Vite handles TypeScript automatically
- **Imports:** Direct from TypeScript sources (`import { Manifold } from './lib/manifold'`)
- **Hot Reload:** Full Vite HMR support
- **Target:** Modern browsers with ES modules

### Node.js Pipeline Environment
- **Compilation:** Just-in-time via Vite
- **Imports:** Direct from TypeScript sources with JIT compilation
- **Execution:** Node.js ES modules
- **Target:** Node.js 18+ with ES module support

## Shared Code Strategy

Core functionality is shared between environments:

```typescript
// src/lib/export-core.ts - Pure functions (no browser dependencies)
export function manifoldToOBJ(model: Manifold): string { /* ... */ }

// src/lib/export.ts - Browser-specific wrapper
export function exportToOBJ(model: Manifold): Blob {
  const objString = manifoldToOBJ(model);  // Use shared function
  return new Blob([objString], { type: "model/obj" });  // Browser-specific
}
```

## Development Workflow

### For Browser Development
```bash
npm run dev  # Vite handles everything automatically
```

### For Pipeline Development
```bash
npm run pipeline src/models/your-model.ts  # Uses JIT compilation
```

### For Testing
```bash
npm test  # Automatically compiles and runs all tests
```

## Future Plans

- **Library Extraction:** Core functions will be extracted to a separate NPM package
- **Template System:** `create-manifold-script` for project scaffolding
- **Batch Processing:** Multiple model generation with parameter sets
- **Format Support:** STL, 3MF, and other 3D printing formats

## Developer Notes

- The compilation step is only needed for **developers** of this project
- End users should receive pre-compiled libraries
- Browser code never needs manual compilation (Vite handles it)
- Pipeline scripts check for compiled dependencies and provide helpful error messages