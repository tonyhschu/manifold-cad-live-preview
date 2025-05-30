# ManifoldCAD Component & Model System Guide

This guide explains how to create reusable components and models with the ManifoldCAD preview framework, covering both traditional components and the modern parametric model system.

## Overview

The ManifoldCAD framework supports two main patterns for creating 3D content:

1. **Components**: Reusable functions that create geometry and can be composed into larger models
2. **Models**: Complete model definitions that can be either function-based or parametric

## Components - Reusable Geometry Functions

Components are reusable pieces of 3D geometry that can be composed to create more complex models. They're implemented as functions that:

1. Take parameters to customize the geometry
2. Return Manifold objects that can be used in other models
3. Can be imported and used across multiple model files
4. Focus on creating specific geometric shapes or features

### Creating Components

Components are defined as functions in TypeScript files. Each component function should:

1. Take clear parameters that define the component's geometry
2. Return a Manifold object
3. Include validation and error handling for parameters
4. Be well-documented with JSDoc comments

### Example Component

Here's an example of a simple component that creates a hollowed cube:

```typescript
import { Manifold } from "../lib/manifold";

/**
 * Creates a hollow cube with customizable size and wall thickness
 * @param size The outer dimensions of the cube
 * @param wallThickness The thickness of the cube walls
 * @returns A Manifold object representing the hollow cube
 */
export function hollowCube(size: number, wallThickness: number): Manifold {
  // Parameter validation
  if (size <= 0) {
    throw new Error("Size must be greater than 0");
  }
  if (wallThickness <= 0) {
    throw new Error("Wall thickness must be greater than 0");
  }

  // Create outer cube
  const outerCube = Manifold.cube([size, size, size], true);

  // Calculate inner dimensions
  const innerSize = size - (wallThickness * 2);

  // If inner size is too small, return solid cube
  if (innerSize <= 0) {
    return outerCube;
  }

  // Create inner cube and subtract from outer cube
  const innerCube = Manifold.cube([innerSize, innerSize, innerSize], true);
  return Manifold.difference(outerCube, innerCube);
}
```

## Models - Complete Model Definitions

Models are complete 3D objects that can be loaded and displayed in the preview system. The framework supports two types of models:

### 1. Function-Based Models

Simple models that export a function as the default export:

```typescript
// src/models/simple-cube.ts
import { Manifold } from "../lib/manifold";

/**
 * Creates a simple cube model
 */
export default function createCube(size = 15, centered = true): Manifold {
  return Manifold.cube([size, size, size], centered);
}
```

### 2. Parametric Models

Advanced models with interactive parameter controls using the ParametricConfig system:

```typescript
// src/models/parametric-cube.ts
import { Manifold } from "../lib/manifold";
import { P, createConfig } from "../types/parametric-config";
import type { ParametricConfig } from "../types/parametric-config";

function createCube(size = 15, centered = true): Manifold {
  return Manifold.cube([size, size, size], centered);
}

// Export parametric configuration as default
export default createConfig(
  {
    size: P.number(15, 1, 100, 1),
    centered: P.boolean(true)
  },
  (params) => createCube(params.size, params.centered),
  {
    name: "Parametric Cube",
    description: "A simple parametric cube with configurable size"
  }
);

// Also export the pure function for composition
export { createCube };
```

### Parameter Types

The parametric system supports various parameter types:

- `P.number(default, min, max, step)` - Numeric sliders with optional constraints
- `P.boolean(default)` - Checkboxes for true/false values
- `P.select(default, options)` - Dropdown selections from predefined options
- `P.string(default)` - Text input fields
- `P.color(default)` - Color picker controls

### Model Registration

To make models available in the UI, add them to the `availableModels` registry in `src/core/model-loader.ts`:

```typescript
export const availableModels = [
  // Function-based models
  { id: "cube", path: "../models/cube", name: "Simple Cube", type: "static" as const },

  // Parametric models
  { id: "parametric-hook", path: "../models/parametric-hook", name: "Parametric Hook", type: "parametric" as const },
];
```

## Organizing Components and Models

Components and models should be organized in a logical folder structure:

```
src/
├── models/
│   ├── cube.ts              # Simple models
│   ├── parametric-hook.ts   # Parametric models
│   ├── shapes.ts            # Component library
│   └── components/          # Additional component libraries
│       ├── connectors.ts    # Components for connecting parts
│       ├── mechanics.ts     # Mechanical components
│       └── utils.ts         # Utility components
```

Group related components in a single file based on their function or domain.

## Using Components in Models

Components can be used in both function-based and parametric models:

### In Function-Based Models

```typescript
import { hollowCube, cylinderWithHole } from "./shapes";
import { Manifold } from "../lib/manifold";

export default function createModel(): Manifold {
  // Create components
  const box = hollowCube(20, 2);
  const tube = cylinderWithHole(5, 30, 2);

  // Combine components
  return Manifold.union([box, tube]);
}
```

### In Parametric Models

```typescript
import { hollowCube, cylinderWithHole } from "./shapes";
import { Manifold } from "../lib/manifold";
import { P, createConfig } from "../types/parametric-config";

function createCompositeModel(
  boxSize: number,
  wallThickness: number,
  tubeRadius: number,
  tubeHeight: number
): Manifold {
  const box = hollowCube(boxSize, wallThickness);
  const tube = cylinderWithHole(tubeRadius, tubeHeight, tubeRadius * 0.5);

  return Manifold.union([box, tube.translate([0, 0, boxSize/2])]);
}

export default createConfig(
  {
    boxSize: P.number(20, 5, 50, 1),
    wallThickness: P.number(2, 0.5, 5, 0.1),
    tubeRadius: P.number(5, 2, 15, 0.5),
    tubeHeight: P.number(30, 10, 60, 1)
  },
  (params) => createCompositeModel(
    params.boxSize,
    params.wallThickness,
    params.tubeRadius,
    params.tubeHeight
  ),
  {
    name: "Composite Model",
    description: "A model combining multiple components"
  }
);
```

## Best Practices

### For Components

1. **Parameter Validation**: Always validate input parameters and provide meaningful error messages.

2. **Type Safety**: Use TypeScript types and return `Manifold` objects explicitly.

3. **Documentation**: Add JSDoc comments describing parameters, return values, and usage examples.

4. **Reusability**: Design components to be reusable across different models and contexts.

5. **Composition**: Build complex components by composing simpler ones.

6. **Naming**: Use clear, descriptive names for component functions.

### For Models

1. **Dual Export Pattern**: For parametric models, export both the config (default) and the pure function:
   ```typescript
   export default createConfig(/* parametric config */);
   export { createModelFunction }; // Pure function for composition
   ```

2. **Parameter Organization**: Group related parameters logically and use meaningful names.

3. **Metadata**: Always include `name` and `description` in parametric configs.

4. **Default Values**: Choose sensible defaults that create interesting, valid models.

5. **Parameter Constraints**: Use min/max/step values to guide users toward valid inputs.

### General Guidelines

1. **Consistent Units**: Maintain consistent units throughout your component and model system.

2. **Error Handling**: Provide clear error messages for invalid parameters or operations.

3. **Performance**: Consider polygon count and complexity for real-time preview.

4. **Modularity**: Keep components focused on single responsibilities.

## Advanced Techniques

### Parameterized Components

Create components that adapt to a wide range of parameters:

```typescript
import { Manifold } from "../lib/manifold";

export function roundedBox(
  size: [number, number, number],
  radius: number,
  center = true
): Manifold {
  // Validate parameters
  if (radius <= 0) {
    throw new Error("Radius must be positive");
  }

  // Make sure radius isn't too large
  const minDimension = Math.min(...size);
  const safeRadius = Math.min(radius, minDimension / 2);

  // Create the basic box
  const mainBox = Manifold.cube(size, center);

  // Add rounded edges using sphere intersections
  // (Implementation would involve creating spheres at corners
  // and using hull operations - simplified here)

  return mainBox;
}
```

### Component Libraries

Group related components into libraries:

```typescript
// src/models/components/mechanical.ts
import { Manifold } from "../../lib/manifold";

export function gear(teeth: number, radius: number, thickness: number): Manifold {
  // Gear tooth generation logic
  const anglePerTooth = (2 * Math.PI) / teeth;
  // ... implementation details
  return Manifold.cylinder(radius, thickness);
}

export function pulley(radius: number, thickness: number): Manifold {
  const outer = Manifold.cylinder(radius, thickness);
  const groove = Manifold.cylinder(radius * 0.9, thickness * 0.3);
  return Manifold.difference(outer, groove);
}

export function sprocket(teeth: number, radius: number): Manifold {
  // Sprocket implementation
  return Manifold.cylinder(radius, 5);
}
```

### Advanced Parametric Models

Complex parametric models with conditional logic:

```typescript
import { Manifold } from "../lib/manifold";
import { P, createConfig } from "../types/parametric-config";

function createAdvancedHook(
  thickness: number,
  width: number,
  mountingType: string,
  includeReinforcement: boolean
): Manifold {
  // Base hook geometry
  let hook = Manifold.cylinder(width, thickness/2);

  // Add mounting features based on type
  if (mountingType === "screw") {
    const screwHole = Manifold.cylinder(2, thickness + 2);
    hook = Manifold.difference(hook, screwHole);
  } else if (mountingType === "magnetic") {
    const magnetCavity = Manifold.cylinder(8, 3);
    hook = Manifold.difference(hook, magnetCavity);
  }

  // Add reinforcement if requested
  if (includeReinforcement) {
    const reinforcement = Manifold.cube([thickness * 1.5, width, thickness * 0.5]);
    hook = Manifold.union([hook, reinforcement]);
  }

  return hook;
}

export default createConfig(
  {
    thickness: P.number(3, 1, 10, 0.5),
    width: P.number(13, 5, 50, 1),
    mountingType: P.select("screw", ["screw", "adhesive", "magnetic"]),
    includeReinforcement: P.boolean(true)
  },
  (params) => createAdvancedHook(
    params.thickness,
    params.width,
    params.mountingType,
    params.includeReinforcement
  ),
  {
    name: "Advanced Hook",
    description: "A customizable hook with multiple mounting options and reinforcement"
  }
);
```

## Working with Both Modes

### Browser Mode (Development)

In browser mode, both function-based and parametric models work seamlessly:

- **Function-based models**: Displayed immediately when selected
- **Parametric models**: Show interactive parameter controls in the UI
- **Hot Module Replacement**: Changes to model code update instantly
- **Component changes**: Updates propagate to all models using the component

### Pipeline Mode (Production)

The command-line pipeline supports both model types:

```bash
# Function-based model
npm run pipeline -- src/models/cube.ts --params size=25

# Parametric model with parameter overrides
npm run pipeline -- src/models/parametric-hook.ts --params thickness=5,width=20
```

Both modes use the same TypeScript compilation and model loading system, ensuring consistency.

## Integration Examples

### Component in Multiple Models

```typescript
// src/models/components/fasteners.ts
export function screwHole(diameter: number, depth: number): Manifold {
  return Manifold.cylinder(diameter/2, depth);
}

// src/models/bracket.ts - Function-based model
import { screwHole } from "./components/fasteners";

export default function createBracket(): Manifold {
  const bracket = Manifold.cube([50, 20, 5]);
  const hole = screwHole(4, 6);
  return Manifold.difference(bracket, hole.translate([10, 10, 0]));
}

// src/models/parametric-bracket.ts - Parametric model
import { screwHole } from "./components/fasteners";
import { P, createConfig } from "../types/parametric-config";

export default createConfig(
  {
    width: P.number(50, 20, 100, 5),
    screwDiameter: P.number(4, 2, 8, 0.5)
  },
  (params) => {
    const bracket = Manifold.cube([params.width, 20, 5]);
    const hole = screwHole(params.screwDiameter, 6);
    return Manifold.difference(bracket, hole.translate([10, 10, 0]));
  },
  { name: "Parametric Bracket", description: "Adjustable bracket with screw holes" }
);
```

## Troubleshooting

### Common Issues

1. **Boolean operations failing**: Ensure geometries intersect properly and have valid manifold topology.

2. **Parameter validation errors**: Check that parameter constraints (min/max) are reasonable.

3. **Import errors**: Verify import paths are correct relative to the model file location.

4. **Parametric model not showing controls**: Ensure the model exports a ParametricConfig as default.

5. **Pipeline parameter parsing**: Use correct syntax: `--params key=value,key2=value2`.

### Debugging Tips

1. **Browser Console**: Use developer tools to inspect errors and model generation.

2. **Parameter Logging**: Add `console.log(params)` in parametric model functions to debug parameter values.

3. **Component Testing**: Test components in isolation before using in complex models.

4. **Type Checking**: Use TypeScript's type checking to catch errors early.

5. **Model Registration**: Verify models are added to `availableModels` in `model-loader.ts`.

### Performance Optimization

1. **Polygon Count**: Use appropriate segment counts for cylinders and spheres.

2. **Boolean Operations**: Minimize complex boolean operations in real-time preview.

3. **Component Caching**: Consider memoizing expensive component calculations.

4. **Parameter Constraints**: Use reasonable min/max values to prevent extreme geometry.

## Migration Guide

### Converting Function-Based to Parametric Models

To convert an existing function-based model to parametric:

1. **Extract parameters** from the function signature
2. **Create parameter definitions** using the `P` helpers
3. **Wrap in createConfig** with the parameter definitions
4. **Add metadata** (name, description)
5. **Export both** the config (default) and pure function

```typescript
// Before: Function-based
export default function createCube(size = 15): Manifold {
  return Manifold.cube([size, size, size]);
}

// After: Parametric
import { P, createConfig } from "../types/parametric-config";

function createCube(size = 15): Manifold {
  return Manifold.cube([size, size, size]);
}

export default createConfig(
  { size: P.number(15, 1, 100, 1) },
  (params) => createCube(params.size),
  { name: "Parametric Cube", description: "A simple parametric cube" }
);

export { createCube }; // Keep pure function available
```

This approach maintains backward compatibility while adding interactive parameter controls.