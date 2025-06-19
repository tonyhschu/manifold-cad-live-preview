/**
 * Test V3 Development - Simple Cube Component
 * 
 * Static model for testing V3 pipeline compilation.
 */

export default function createSimpleCube() {
  const manifold = globalThis.manifold;
  if (!manifold) {
    throw new Error('Manifold not available');
  }

  // Create a simple 8x8x8 cube (changed from 5x5x5)
  return manifold.cube([8, 8, 8]);
}

// Optional metadata export
export const modelMetadata = {
  name: "Simple Cube",
  description: "A basic 5x5x5 cube for testing",
  author: "V3 Test Suite"
};
