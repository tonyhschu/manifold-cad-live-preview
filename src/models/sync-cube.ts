// src/models/sync-cube.ts
// A simple example model that creates just a cube using the synchronous API

import { cube } from "../lib/manifold-sync";

/**
 * Creates a simple cube model
 * @returns A Manifold object
 */
export default function createModel() {
  // Create a simple cube - no await needed!
  const shape = cube([15, 15, 15], true);
  console.log("Created simple cube model using sync API", shape);
  
  // Return the model
  return shape;
}

// Model metadata
export const modelMetadata = {
  name: "Sync Cube",
  description: "A basic 15x15x15 cube centered at the origin (using synchronous API)",
  author: "ManifoldCAD Team",
  version: "1.0.0",
};