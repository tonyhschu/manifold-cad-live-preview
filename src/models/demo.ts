// src/models/demo.ts
// Demo model using the Manifold API

import {
  cube,
  cylinder,
  union,
  createManifoldFactory
} from "../lib/manifold";

/**
 * Creates and returns a 3D model using ManifoldCAD operations
 */
export default function createModel() {
  console.log("Creating model with Manifold API");
  
  // Step 1: Create primitive shapes
  console.log("Creating primitive shapes...");
  const shape1 = cube([10, 10, 10]);
  const shape2 = cylinder(5, 15, 32);

  console.log("Created cube", shape1);
  console.log("Created cylinder", shape2);

  // Step 2: Use a boolean operation
  console.log("Performing boolean operations...");
  const combined = union([shape1, shape2]);
  console.log("Union result", combined);

  // Step 3: Create and use a factory (object-oriented approach)
  console.log("Creating and using factory...");
  const factory = createManifoldFactory();

  // Step 4: Create another shape using the factory
  const ball = factory.sphere(7);
  console.log("Created sphere using factory", ball);

  // Step 5: Perform another boolean operation using the factory
  const finalModel = factory.difference(combined, ball);
  console.log("Final model after boolean operations", finalModel);

  // Return the final model
  return finalModel;
}

// Model metadata
export const modelMetadata = {
  name: "Demo Model",
  description: "A cube joined with a cylinder, with a sphere subtracted from it",
  author: "ManifoldCAD Team",
  version: "1.0.0",
};