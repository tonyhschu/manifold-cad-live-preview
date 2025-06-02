// tests/fixtures/simple-cube.ts
// Simple test model for integration testing

import { Manifold } from "../../src/lib/manifold";

/**
 * Simple cube function for testing
 */
export default function createTestCube(size = 10, centered = true): Manifold {
  return Manifold.cube([size, size, size], centered);
}
