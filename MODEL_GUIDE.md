# ManifoldCAD Model Creation Guide

This guide explains how to create 3D models using our ManifoldCAD preview framework.

## Model Structure

Each model file follows a simple structure:

1. A default export function that returns a Manifold object
2. Optional metadata about your model

### Basic Example

```typescript
// src/models/my-model.ts
import { cube, sphere, difference } from "../lib/utilities";

/**
 * Create a simple cube with a spherical hole
 */
export default async function createModel() {
  // Create a cube
  const box = await cube([20, 20, 20], true);
  
  // Create a sphere
  const ball = await sphere(12);
  
  // Subtract the sphere from the cube
  const result = await difference(box, ball);
  
  // Return the final model
  return result;
}

// Optional metadata
export const modelMetadata = {
  name: "Cube with Sphere Cutout",
  description: "A demonstration of boolean operations with basic shapes",
  author: "Your Name",
  version: "1.0.0"
};
```

## Core CSG Operations

The framework provides these basic operations:

### Primitives

- `cube(size, center)` - Create a cube
- `cylinder(radius, height, sides)` - Create a cylinder
- `sphere(radius, resolution)` - Create a sphere

### Boolean Operations

- `union([shapes])` - Combine multiple shapes
- `difference(a, b)` - Subtract shape b from shape a
- `intersection(a, b)` - Create the intersection of two shapes

## Using Components

You can create reusable components by defining functions that return Manifold objects:

```typescript
// src/models/components/my-components.ts
import { cube, cylinder, difference } from "../../lib/utilities";

/**
 * Create a box with a cylindrical hole
 */
export async function boxWithHole(size: number, holeRadius: number) {
  const box = await cube([size, size, size], true);
  const hole = await cylinder(holeRadius, size * 2, 32);
  return difference(box, hole);
}
```

Then use them in your models:

```typescript
// src/models/using-components.ts
import { boxWithHole } from "./components/my-components";

export default async function createModel() {
  return boxWithHole(20, 5);
}
```

## Adding Your Model to the Preview

To make your model available in the preview:

1. Create your model file in the `src/models` directory
2. Add it to the available models in `src/core/model-loader.ts`:

```typescript
export const availableModels = [
  // Existing models...
  { id: 'my-model', path: '../models/my-model', name: 'My Custom Model' },
];
```

Your model will now appear in the dropdown menu in the preview.

## Advanced Usage

### Direct Access to ManifoldCAD

For advanced operations not covered by the utilities, you can access the Manifold module directly:

```typescript
import { manifoldContext } from "../lib/manifold-context";

export default async function createModel() {
  const module = await manifoldContext.getModule();
  
  // Use the module directly
  const shape = module.Manifold.cube([10, 10, 10]);
  
  // Perform transformations
  const transformed = shape.translate([5, 0, 0]).rotate([0, 0, 45]);
  
  return transformed;
}
```

### Creating Component Libraries

Organize related components into libraries for better reusability:

```
src/
├── models/
│   ├── components/
│   │   ├── basic-shapes.ts
│   │   ├── mechanical-parts.ts
│   │   └── connectors.ts
│   ├── my-model.ts
```

## Best Practices

1. **Keep models modular** - Break complex models into components
2. **Use async/await** - All shape creation and operations should use await
3. **Add descriptive metadata** - Helps others understand your model
4. **Comment your code** - Especially for complex operations
5. **Use parameterization** - Make shapes configurable where possible

## Troubleshooting

- If your model doesn't appear in the preview, check for errors in the browser console
- Ensure all async operations are properly awaited
- Verify that your model function returns a valid Manifold object