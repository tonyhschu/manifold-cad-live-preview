# ManifoldCAD Component System Guide

This guide explains how to create and use reusable components with the ManifoldCAD preview framework.

## What Are Components?

Components are reusable pieces of 3D geometry that can be composed to create more complex models. They're implemented as functions that:

1. Take parameters to customize the geometry
2. Return Manifold objects that can be used in other models
3. Can be imported and used across multiple model files

## Creating Components

Components are defined as functions in TypeScript files. Each component function should:

1. Take clear parameters that define the component's geometry
2. Return a Manifold object
3. Include validation and error handling for parameters
4. Be well-documented with JSDoc comments

### Example Component

Here's an example of a simple component that creates a hollowed cube:

```typescript
/**
 * Creates a hollow cube with customizable size and wall thickness
 * @param size The outer dimensions of the cube
 * @param wallThickness The thickness of the cube walls
 * @returns A Manifold object representing the hollow cube
 */
export function hollowCube(size: number, wallThickness: number) {
  // Parameter validation
  if (size <= 0) {
    throw new Error("Size must be greater than 0");
  }
  if (wallThickness <= 0) {
    throw new Error("Wall thickness must be greater than 0");
  }

  // Create outer cube
  const outerCube = cube([size, size, size], true);
  
  // Calculate inner dimensions
  const innerSize = size - (wallThickness * 2);
  
  // If inner size is too small, return solid cube
  if (innerSize <= 0) {
    return outerCube;
  }
  
  // Create inner cube and subtract from outer cube
  const innerCube = cube([innerSize, innerSize, innerSize], true);
  return difference(outerCube, innerCube);
}
```

## Organizing Components

Components should be organized in a logical folder structure:

```
src/
├── models/
│   ├── components/
│   │   ├── shapes.ts      # Basic shape components
│   │   ├── connectors.ts  # Components for connecting parts
│   │   ├── mechanics.ts   # Mechanical components
│   │   └── utils.ts       # Utility components
```

Group related components in a single file based on their function or domain.

## Using Components

To use components in your models:

1. Import the component functions from their location
2. Call the functions with the desired parameters
3. Use the resulting Manifold objects in your model

Example:

```typescript
import { hollowCube, cylinderWithHole } from "./components/shapes";
import { difference, union } from "../lib/manifold";

export default function createModel() {
  // Create a hollow cube
  const box = hollowCube(20, 2);
  
  // Create a cylinder with a hole
  const tube = cylinderWithHole(5, 30, 2);
  
  // Combine components
  return union([box, tube]);
}
```

## Best Practices

1. **Parameter Validation**: Always validate input parameters and provide meaningful error messages.

2. **Consistent Units**: Maintain consistent units throughout your component system.

3. **Parameterization**: Make components customizable through parameters rather than hardcoding values.

4. **Documentation**: Add JSDoc comments to component functions describing parameters and return values.

5. **Reusability**: Design components to be reusable across different models.

6. **Composition**: Build complex components by composing simpler ones.

7. **Naming**: Use clear, descriptive names for component functions.

## Advanced Component Techniques

### Parameterized Components

Create components that adapt to a wide range of parameters:

```typescript
export function roundedBox(
  size: [number, number, number],
  radius: number,
  center = true
) {
  // Validate parameters
  if (radius <= 0) {
    throw new Error("Radius must be positive");
  }
  
  // Make sure radius isn't too large
  const minDimension = Math.min(...size);
  const safeRadius = Math.min(radius, minDimension / 2);
  
  // Create the box
  const mainBox = cube(size, center);
  
  // Add rounded edges (implementation details...)
  // ...
  
  return result;
}
```

### Component Libraries

Group related components into libraries:

```typescript
// components/mechanical.ts
export function gear(teeth: number, radius: number, thickness: number) { /* ... */ }
export function pulley(radius: number, thickness: number) { /* ... */ }
export function sprocket(teeth: number, radius: number) { /* ... */ }
```

### Transformable Components

Components can include transformation options:

```typescript
export function tube(
  outerRadius: number,
  innerRadius: number,
  height: number,
  transform?: { rotate?: [number, number, number], translate?: [number, number, number] }
) {
  // Create basic tube
  const outer = cylinder(outerRadius, height);
  const inner = cylinder(innerRadius, height + 1); // Slightly taller to ensure complete hole
  let result = difference(outer, inner);
  
  // Apply transformations if provided
  if (transform) {
    if (transform.rotate) {
      result = result.rotate(transform.rotate);
    }
    if (transform.translate) {
      result = result.translate(transform.translate);
    }
  }
  
  return result;
}
```

## Troubleshooting

### Common Issues

1. **Boolean operations failing**: Ensure geometries intersect properly.
2. **Unexpected results**: Check parameter values and validate inputs.
3. **Poor performance**: Simplify complex geometries and reduce polygon counts.

### Tips

- Use the `getModule()` function to access the raw ManifoldCAD module for advanced operations.
- Break complex components into smaller, simpler parts.
- Use the browser's developer console to debug component creation.