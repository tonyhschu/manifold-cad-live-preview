// src/models/sync-compound.ts
// A model that uses components from the sync component library

import { union } from "../lib/manifold-sync";
import { hollowCube, cylinderWithHole, sphericalCap } from "./components/sync-shapes";

/**
 * Creates a compound model using multiple components
 * Notice the lack of async/await - everything is synchronous!
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
  const finalModel = union([box, tube, cap]);
  
  console.log("Sync compound model created successfully");
  return finalModel;
}

// Model metadata
export const modelMetadata = {
  name: "Sync Compound Model",
  description: "A hollow cube, cylinder with hole, and spherical cap combined (using synchronous API)",
  author: "ManifoldCAD Team",
  version: "1.0.0",
};