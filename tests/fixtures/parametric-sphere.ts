// tests/fixtures/parametric-sphere.ts
// Simple parametric model for integration testing

import { Manifold } from "../../src/lib/manifold";
import { P, createConfig } from "../../src/types/parametric-config";
import type { ParametricConfig } from "../../src/types/parametric-config";

/**
 * Simple sphere function for testing
 */
function createTestSphere(radius = 5, segments = 16): Manifold {
  return Manifold.sphere(radius, segments);
}

// Parametric configuration
export const sphereConfig: ParametricConfig = createConfig(
  {
    radius: P.number(5, 1, 20, 0.5),
    segments: P.number(16, 8, 64, 1)
  },
  (params) => createTestSphere(params.radius, params.segments),
  {
    name: "Test Sphere",
    description: "A simple parametric sphere for testing"
  }
);

// Export parametric config as default
export default sphereConfig;

// Also export the pure function
export { createTestSphere };
