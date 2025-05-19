# ManifoldCAD Preview Environment

This project demonstrates a preview environment for code-based 3D modeling using ManifoldCAD's WASM library. It includes a pattern for managing the asynchronous loading of the Manifold module, creating 3D shapes, and exporting them in both OBJ and GLB formats.

## Features

- Singleton pattern for managing Manifold WASM module
- Asynchronous loading and initialization
- Basic 3D operations (cube, cylinder, sphere, union, difference)
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

- `src/lib/manifold-context.ts` - Manages the Manifold WASM module
- `src/lib/utilities.ts` - Utility functions for creating 3D shapes
- `src/lib/gltf-export.ts` - GLB export utilities
- `src/lib/manifold-gltf.ts` - EXT_mesh_manifold extension implementation
- `src/main.ts` - Main application logic

## Implementation Details

This project demonstrates several key concepts:

1. **ManifoldContext Pattern** - A singleton pattern that manages the async loading of the Manifold WASM module, ensuring it's only initialized once
2. **Utility Functions** - Wrappers around Manifold operations to simplify usage
3. **GLB Export** - Implementation of the EXT_mesh_manifold extension for glTF to preserve manifold properties
4. **Model Viewer Integration** - Using Google's `<model-viewer>` web component to visualize 3D models

## Learning Resources

- [ManifoldCAD Documentation](https://github.com/elalish/manifold)
- [model-viewer Documentation](https://modelviewer.dev/)
- [glTF Documentation](https://github.com/KhronosGroup/glTF)
