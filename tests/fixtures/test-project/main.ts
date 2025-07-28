/**
 * Simple test model for integration testing
 * This is a minimal model that exercises all critical code paths
 */

// V3 Parametric Model Configuration
// This file is automatically discovered and compiled by the V3 pipeline

// Access Manifold from global scope (set up by the configurator)
declare const manifold: any;

/**
 * Creates a simple parametric cube for testing
 */
function createTestCube(params: {
  size: number;
  height: number;
}) {
  const { size, height } = params;

  // Create a simple cube for testing
  const cube = manifold.cube([size, size, height], true);
  return cube;
}

// V3 Parametric Configuration
// This is the format that the V3 pipeline expects
export default {
  name: "Test Cube",
  description: "A simple cube for integration testing",
  parameters: {
    size: {
      value: 10,
      min: 5,
      max: 20,
      step: 1
    },
    height: {
      value: 5,
      min: 2,
      max: 15,
      step: 1
    }
  },
  generateModel: createTestCube
};
