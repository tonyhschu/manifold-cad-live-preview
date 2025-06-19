// Welcome to Manifold Studio!
// This is your main model file - customize it to create your own 3D designs

// V3 Parametric Model Configuration
// This file is automatically discovered and compiled by the V3 pipeline

// Access Manifold from global scope (set up by the configurator)
declare const manifold: any;

/**
 * Creates a parametric box with customizable dimensions and features
 */
function createParametricBox(params: {
  width: number;
  height: number;
  depth: number;
  wallThickness: number;
  hasLid: boolean;
  cornerRadius: number;
}) {
  const { width, height, depth, wallThickness, hasLid, cornerRadius } = params;

  // Create the outer box
  let outerBox = manifold.cube([width, height, depth], true);

  // Add corner rounding if requested
  if (cornerRadius > 0) {
    // Simple rounding approximation - you can enhance this
    const roundingCylinder = manifold.cylinder(depth + 2, cornerRadius, cornerRadius)
      .rotate([90, 0, 0]);

    // Apply rounding to corners (simplified version)
    outerBox = outerBox; // Placeholder for actual rounding logic
  }

  // Create the inner cavity
  const innerBox = manifold.cube([
    width - wallThickness * 2,
    height - wallThickness * 2,
    depth - wallThickness
  ], true).translate([0, 0, wallThickness / 2]);

  // Subtract inner from outer to create walls
  let box = manifold.difference(outerBox, innerBox);

  // Add lid if requested
  if (hasLid) {
    const lid = manifold.cube([
      width - wallThickness,
      height - wallThickness,
      wallThickness
    ], true).translate([0, 0, depth / 2 + wallThickness / 2]);

    box = manifold.union([box, lid]);
  }

  return box;
}

// V3 Parametric Configuration
// This is the new format that the V3 pipeline expects
export default {
  name: "Parametric Box",
  description: "A customizable box with adjustable dimensions and features",
  parameters: {
    width: {
      value: 20,
      min: 10,
      max: 100,
      step: 1
    },
    height: {
      value: 15,
      min: 10,
      max: 100,
      step: 1
    },
    depth: {
      value: 10,
      min: 5,
      max: 50,
      step: 1
    },
    wallThickness: {
      value: 2,
      min: 1,
      max: 5,
      step: 0.5
    },
    hasLid: {
      value: true
    },
    cornerRadius: {
      value: 1,
      min: 0,
      max: 5,
      step: 0.5
    }
  },
  generateModel: createParametricBox
};
