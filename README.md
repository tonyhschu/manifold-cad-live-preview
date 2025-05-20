# ManifoldCAD Test Project

A test project for working with 3D CAD models using ManifoldCAD and Vite.

## Hot Module Replacement (HMR) Integration

This project demonstrates how to integrate Vite's Hot Module Replacement (HMR) API with a 3D CAD visualization environment. The implementation allows for real-time updates to models, UI components, and rendering code without losing application state.

### HMR Features

- Automatic detection of file changes in model definitions
- Targeted updates based on file type (models, UI components, rendering code)
- State preservation during updates
- Clean error handling with fallback to full reload

### How it Works

The HMR integration is structured in three main parts:

1. **HMR Handler Module** (`src/hmr-handler.ts`):

   - Central hub for all HMR logic
   - Provides utility functions for HMR setup
   - Registers file-specific update handlers
   - Manages module disposition

2. **Preview Component HMR** (`src/core/preview.ts`):

   - Tracks the current model ID for reloading
   - Provides a `refreshView()` method that can be called on HMR updates
   - Preserves UI state during updates

3. **Application Entry Point** (`src/main.ts`):
   - Creates and maintains a shared context for HMR
   - Sets up HMR handlers through the HMR module
   - Accepts HMR updates for itself

### Example: Updating a Model Definition

When you modify a model definition file:

1. Vite detects the change and sends an HMR update
2. The HMR handler identifies it as a model update
3. The current model is reloaded with the new definition
4. The view refreshes with the updated model while preserving camera position and UI state

## Development

To start the development server with HMR enabled:

```bash
npm run dev
```

````

## Why?

This all started with my frustration in trying to use ManifoldCAD as a library. The ManifoldCAD.org web editor works great, but I couldn't import other libraries like clipperjs or d3js. I needed ManifoldCAD to play well with the rest of the NPM ecosystem. The main problem is that Manifold is a WASM module which requires async loading. So this project is a way to work around that by providing a synchronous modeling API and using top level away. At a high level...

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
````

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
