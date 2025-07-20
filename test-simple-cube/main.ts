export default function createSimpleCube() {
  const manifold = globalThis.manifold;
  if (!manifold) {
    throw new Error('Manifold not available');
  }

  // Create a simple 5x5x5 cube
  return manifold.cube([5, 5, 5]);
}

// Optional metadata export
export const metadata = {
  name: "Simple Cube",
  description: "A basic 5x5x5 cube for testing (updated!)",
  author: "V3 Test Suite",
  version: "1.0.1"
};
