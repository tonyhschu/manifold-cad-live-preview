// src/models/simple-cube.ts
// A simple example model that creates just a cube

import { cube } from "../lib/utilities";

/**
 * Creates a simple cube model
 * @returns Promise that resolves to a Manifold object
 */
export default async function createModel() {
  // Create a simple cube
  const shape = await cube([15, 15, 15], true);
  console.log("Created simple cube model", shape);
  
  // Return the model
  return shape;
}

// Model metadata
export const modelMetadata = {
  name: "Simple Cube",
  description: "A basic 15x15x15 cube centered at the origin",
  author: "ManifoldCAD Team",
  version: "1.0.0",
};