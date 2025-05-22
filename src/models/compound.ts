// src/models/compound.ts
// A model that uses components from the component library

import { Manifold } from "../lib/manifold";
import { hollowCube, cylinderWithHole, sphericalCap } from "./shapes";

/**
 * Creates a compound model using multiple components
 */
export default function createModel() {
  // Create a hollow cube
  console.log("Creating hollow cube...");
  const box = hollowCube(20, 2);

  // Create a cylinder with a hole
  console.log("Creating cylinder with hole...");
  const tube = cylinderWithHole(5, 30, 2);

  // Create a spherical cap
  console.log("Creating spherical cap...");
  const cap = sphericalCap(10, 5);

  // Combine all shapes
  console.log("Combining shapes...");
  const finalModel = Manifold.union([box, tube, cap]);

  console.log("Compound model created successfully");
  return finalModel;
}

// Model metadata
export const modelMetadata = {
  name: "Compound Model",
  description: "A hollow cube, cylinder with hole, and spherical cap combined",
  author: "ManifoldCAD Team",
  version: "1.0.0",
};
