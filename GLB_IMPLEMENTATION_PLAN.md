# GLB Export Implementation Plan for ManifoldCAD

This document outlines the approach for implementing GLB export and model-viewer integration in our ManifoldCAD test project.

## Background

Our current project successfully creates and manipulates 3D models using ManifoldCAD's WASM library in an asynchronous context. While we've implemented OBJ export for downloading models, we need to add GLB (glTF Binary) support to:

1. Enable proper viewing in Google's `<model-viewer>` component
2. Preserve manifold properties in the exported files
3. Support texture/material information in the exported models

## Implementation Plan

### 1. Dependencies

Add the following dependency:
```
@gltf-transform/core
```

### 2. File Structure

Create the following new files:
- `src/lib/manifold-gltf.ts` - Extension to preserve manifold mesh properties
- `src/lib/gltf-export.ts` - Utilities for converting and exporting GLB

### 3. Implementation Steps

#### Step 1: Implement the EXT_mesh_manifold Extension

The `manifold-gltf.ts` file will include:
- A custom extension for `@gltf-transform/core`
- Classes to handle manifold properties in glTF format
- Methods to read/write the extension data

This extension ensures lossless preservation of manifold mesh topology, even with material boundaries and vertex properties.

#### Step 2: Create GLTF Export Utilities

The `gltf-export.ts` file will include:
- Functions to convert Manifold meshes to glTF format
- Utilities for handling materials and textures
- Methods to create GLB binary blobs

The export process will:
1. Create a glTF Document
2. Convert Manifold mesh data to glTF format
3. Add the manifold extension
4. Export as GLB binary

#### Step 3: Update the Main Application

Modify `src/main.ts` to:
- Integrate with the model-viewer component
- Add GLB export functionality alongside OBJ
- Create utility functions to display the model

#### Step 4: Enhance the UI

- Show loading states during model generation
- Make the model-viewer visible when models are ready
- Provide download options for both OBJ and GLB

## Technical Approach

Our implementation will follow these principles:

1. **Maintain Separation of Concerns**
   - Keep the manifold context pattern intact
   - Add GLB export as an additional capability
   - Ensure async operations are properly handled

2. **Preserve Manifold Properties**
   - Use the EXT_mesh_manifold extension
   - Maintain topology information through exports
   - Support vertex properties like UVs and colors

3. **Optimize for Visualization**
   - Focus on model-viewer compatibility
   - Support proper material rendering
   - Ensure efficient binary format

## References

This implementation is based on the approach used in the ManifoldCAD project by Emmett Lalish:
- https://manifoldcad.org/model-viewer.html
- https://github.com/elalish/manifold

The EXT_mesh_manifold extension allows for lossless roundtrip of manifold meshes through glTF, preserving the data that would otherwise be lost in standard export formats.
