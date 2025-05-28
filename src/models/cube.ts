// src/models/cube.ts
import { Manifold } from "../lib/manifold";
import { P, createConfig } from "../types/parametric-config";
import type { ParametricConfig } from "../types/parametric-config";

/**
 * Creates a parametric cube model
 */
function createCube(size = 15, centered = true): Manifold {
  return Manifold.cube([size, size, size], centered);
}

// Export the pure function as default for pipeline compatibility
export default createCube;

// Keep the parametric config for UI compatibility
export const cubeConfig: ParametricConfig = createConfig(
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

// Also export the pure function by name
export { createCube };
