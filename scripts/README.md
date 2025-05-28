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

### `compile-manifold.js`
Compiles core TypeScript libraries for Node.js consumption:
- `src/lib/manifold.ts` → `dist/lib/manifold.js`
- `src/lib/export-core.ts` → `dist/lib/export-core.js`

**When to run:** Automatically via `npm run compile` or `npm run pipeline`

### `pipeline-v2.js` ⭐ **Current Pipeline**
Modern Vite-based pipeline for generating 3D models:
- Uses Vite's library compilation mode
- Compiles TypeScript models on-demand
- Imports shared export functions from `dist/lib/`
- Supports parameter overrides

**Usage:**
```bash
npm run pipeline src/models/cube.ts --params size=25
node scripts/pipeline-v2.js src/models/hook.ts --params thickness=5,width=20
```

## Environment Separation

### Browser Environment
- **Compilation:** Vite handles TypeScript automatically
- **Imports:** Direct from TypeScript sources (`import { Manifold } from './lib/manifold'`)
- **Hot Reload:** Full Vite HMR support
- **Target:** Modern browsers with ES modules

### Node.js Pipeline Environment  
- **Compilation:** Pre-compiled via `compile-manifold.js`
- **Imports:** From compiled JavaScript (`import { manifoldToOBJ } from '../dist/lib/export-core.js'`)
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
npm run compile  # Compile core libraries
npm run pipeline src/models/your-model.ts
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