/**
 * Simple component for HMR testing
 * This component will be modified during HMR tests
 */

// V3 Parametric Model Configuration
// This file is automatically discovered and compiled by the V3 pipeline

// Access Manifold from global scope (set up by the configurator)
declare const manifold: any;

/**
 * Creates a simple parametric cube component for HMR testing
 */
function createSimpleCube(params: {
  width: number;
  depth: number;
  height: number;
}) {
  const { width, depth, height } = params;

  // Create a simple rectangular cube
  const cube = manifold.cube([width, depth, height], true);
  return cube;
}

// V3 Parametric Configuration
// This is the format that the V3 pipeline expects
export default {
  name: "Simple Cube Component",
  description: "A basic cube component for testing HMR functionality",
  parameters: {
    width: {
      value: 5,
      min: 2,
      max: 15,
      step: 1
    },
    depth: {
      value: 5,
      min: 2,
      max: 15,
      step: 1
    },
    height: {
      value: 3,
      min: 1,
      max: 10,
      step: 1
    }
  },
  generateModel: createSimpleCube
};
