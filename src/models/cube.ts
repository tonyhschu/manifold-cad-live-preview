// src/models/cube.ts
// A simple example model that creates just a cube

import { cube } from "../lib/manifold";

/**
 * Creates a simple cube model
 * @returns A Manifold object
 */
export default function createModel() {
  // Create a simple cube
  const shape = cube([15, 15, 15], true);
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