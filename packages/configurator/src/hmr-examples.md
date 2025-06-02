# Vite HMR Examples for ManifoldCAD

This document provides practical examples of using Hot Module Replacement (HMR) in the ManifoldCAD preview environment.

## Basic HMR Example

The simplest example is detecting when the module itself changes:

```ts
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    console.log('Module updated:', newModule);
    // Perform any update logic here
  });
}
```

## Handling Specific File Changes

Example of handling updates to specific file types:

```ts
// Listen for changes in model files
if (import.meta.hot) {
  import.meta.hot.accept(/\.\/.+\/models\/.+\.ts$/, (modules) => {
    console.log('Model module(s) updated:', modules);
    if (modules && modules.length > 0) {
      // Reload the current model with the new definition
      reloadCurrentModel();
    }
  });
}
```

## Updating Imported Modules

When you need to handle updates to imported dependencies:

```ts
import { renderScene } from './renderer';

if (import.meta.hot) {
  import.meta.hot.accept('./renderer', (newModule) => {
    if (newModule) {
      // Use the updated renderScene function
      newModule.renderScene(currentModel);
    }
  });
}
```

## Preserving State During Updates

To maintain state across HMR updates:

```ts
let cameraPosition = { x: 0, y: 0, z: 5 };
let selectedObjects = [];

if (import.meta.hot) {
  // Store state before update
  import.meta.hot.dispose((data) => {
    data.cameraPosition = cameraPosition;
    data.selectedObjects = selectedObjects;
  });

  // Restore state after update
  if (import.meta.hot.data) {
    cameraPosition = import.meta.hot.data.cameraPosition || cameraPosition;
    selectedObjects = import.meta.hot.data.selectedObjects || selectedObjects;
  }
}
```

## Managing WebGL Resources

For 3D visualization, you often need to clean up WebGL resources:

```ts
let renderer, scene, camera;

function initScene() {
  renderer = new WebGLRenderer();
  scene = new Scene();
  camera = new PerspectiveCamera();
  // ... setup code
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    // Clean up WebGL resources
    if (renderer) {
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      renderer = null;
    }
  });
}
```

## Handling HMR for UI Component Updates

For UI components that display model information:

```ts
if (import.meta.hot) {
  import.meta.hot.accept(['./components/controls', './components/info-panel'], (modules) => {
    // Re-render the UI without reloading the model
    if (uiContainer) {
      refreshUIComponents();
    }
  });
}
```

## Using Custom HMR Events

Custom events can communicate between modules during updates:

```ts
// In a plugin or main module
if (import.meta.hot) {
  // Send a custom event
  import.meta.hot.send('model-updated', { id: 'cube', changed: 'geometry' });
}

// In another module
if (import.meta.hot) {
  // Listen for the custom event
  import.meta.hot.on('model-updated', (data) => {
    console.log(`Model ${data.id} had its ${data.changed} updated`);
    // Update visualization if needed
  });
}
```

## Advanced: Creating a Vite Plugin for CAD-specific HMR

For more complex scenarios, you can create a custom Vite plugin:

```ts
// vite.config.js
export default defineConfig({
  plugins: [
    {
      name: 'cad-hmr',
      handleHotUpdate({ file, server }) {
        // Custom handling for different file types
        if (file.endsWith('.model.ts')) {
          console.log('Model file changed:', file);
          // Extract model ID from file path
          const modelId = path.basename(file).replace('.model.ts', '');
          
          // Send custom update to client
          server.ws.send({
            type: 'custom',
            event: 'model-changed',
            data: { modelId }
          });
          
          // Let Vite handle the module replacement
          return;
        }
        
        if (file.endsWith('.material.ts')) {
          // Handle material file changes
          // ...
        }
      }
    }
  ]
})
```

Then in your client code:

```ts
if (import.meta.hot) {
  import.meta.hot.on('model-changed', ({ modelId }) => {
    // Reload just the changed model if it's currently displayed
    if (currentModelId === modelId) {
      preview.loadAndRenderModel(modelId);
    }
  });
}
```

These examples demonstrate various approaches to integrating HMR with the ManifoldCAD preview environment, from basic module acceptance to advanced custom update handling.