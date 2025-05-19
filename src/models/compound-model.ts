// src/models/compound-model.ts
// A model that uses components from the component library

import { union } from "../lib/utilities";
import { hollowCube, cylinderWithHole } from "./components/simple-shapes";

/**
 * Creates a compound model using multiple components
 * @returns Promise that resolves to a Manifold object
 */
export default async function createModel() {
  // Create a hollow cube
  console.log("Creating hollow cube...");
  const box = await hollowCube(20, 2);
  
  // Create a cylinder with a hole
  console.log("Creating cylinder with hole...");
  const tube = await cylinderWithHole(5, 30, 2);
  
  // Combine them
  console.log("Combining shapes...");
  const finalModel = await union([box, tube]);
  
  console.log("Compound model created successfully");
  return finalModel;
}

// Model metadata
export const modelMetadata = {
  name: "Compound Model",
  description: "A hollow cube combined with a cylinder that has a hole through it",
  author: "ManifoldCAD Team",
  version: "1.0.0",
};