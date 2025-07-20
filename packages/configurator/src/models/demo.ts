// src/models/demo.ts
// Demo model using the Manifold API

import { Manifold } from "@manifold-studio/wrapper";

/**
 * Creates and returns a 3D model using ManifoldCAD operations
 */
export default function createModel() {
  // Step 1: Create primitive shapes
  const shape1 = Manifold.cube([10, 10, 10]);
  const shape2 = Manifold.cylinder(5, 15, 32);

  // Step 2: Use a boolean operation
  const combined = Manifold.union([shape1, shape2]);

  // Step 3: Create another shape
  const ball = Manifold.sphere(7);

  // Step 4: Perform another boolean operation
  const finalModel = Manifold.difference(combined, ball);

  // Return the final model
  return finalModel;
}

// Model metadata
export const modelMetadata = {
  name: "Demo Model",
  description:
    "A cube joined with a cylinder, with a sphere subtracted from it",
  author: "ManifoldCAD Team",
  version: "1.0.0",
};
