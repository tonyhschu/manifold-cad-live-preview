# ManifoldCAD Preview Environment

This project demonstrates a preview environment for code-based 3D modeling using ManifoldCAD's WASM library. It includes a pattern for managing the Manifold module, creating 3D shapes, and exporting them in both OBJ and GLB formats.

## Features

- Synchronous API for 3D modeling with clean, await-free code
- Top-level await pattern for WASM module initialization
- Basic 3D operations (cube, cylinder, sphere, union, difference)
- Component-based modeling system
- Export to OBJ and GLB formats
- 3D model visualization using Google's `<model-viewer>` component

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

## Running the Project

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:5173` to see the preview environment in action.

## Project Structure

```
src/
├── core/               # Framework core
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

## Implementation Details

This project demonstrates several key concepts:

1. **Synchronous Modeling API** - Clean, await-free code for better DX
2. **Component System** - Reusable modeling components for composition
3. **GLB Export** - Implementation of the EXT_mesh_manifold extension for glTF
4. **Model Viewer Integration** - Using Google's `<model-viewer>` web component

## Creating Your Own Models

See the [MODEL_GUIDE.md](MODEL_GUIDE.md) file for detailed instructions on creating your own models using this framework.

## Technical Explanation: How Top-Level Await Works

The key to our approach is the top-level await in the `manifold.ts` file:

```typescript
// Use top-level await to initialize the module
console.log("Initializing Manifold module (top-level await)...");
const manifoldModule = await ManifoldModule();
manifoldModule.setup();
console.log("Manifold module initialized successfully");
```

When the JavaScript module system loads `manifold.ts`, it:

1. Sees the top-level await
2. Waits for the promise to resolve before continuing
3. Only executes the rest of the code after the WASM is loaded

The top-level await effectively turns the entire module into an asynchronous operation, but the JavaScript module system handles this behind the scenes. Any module that imports from `manifold.ts` will wait until the WASM initialization is complete before executing.

Then, we export synchronous functions that use the already-initialized WASM module:

```typescript
// Export primitive creation functions
export function cube(size: Readonly<Vec3> | number, center = false): Manifold {
  return manifoldModule.Manifold.cube(size, center);
}
```

These functions don't need to be async because we know the module is already initialized.

The critical path works like this:

1. **Application startup**: 
   - The browser loads `main.ts`
   - It imports from `core/preview.ts`
   - That imports from `lib/manifold.ts`
   - JavaScript sees top-level await and waits for WASM to load
   - Only after WASM is loaded does the execution continue

2. **Model execution time**:
   - When a user selects a model, it triggers `loadAndRenderModel` in preview.ts
   - That calls `loadModelById` in model-loader.ts
   - The model loader dynamically imports the model file
   - The model file imports from `lib/manifold.ts`
   - But since `manifold.ts` was already loaded and initialized, this import is instant
   - The model function (e.g., `createModel`) uses the already-initialized manifold module

The only places where we still need async/await are:
1. Dynamic importing of model files (with `import()`)
2. GLB generation (because the glTF library has some async operations)

This approach concentrates all the async complexity at the application boundaries while keeping the core modeling code pure and synchronous.

## Learning Resources

- [ManifoldCAD Documentation](https://github.com/elalish/manifold)
- [model-viewer Documentation](https://modelviewer.dev/)
- [glTF Documentation](https://github.com/KhronosGroup/glTF)
- [Top-level await (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await#top_level_await)