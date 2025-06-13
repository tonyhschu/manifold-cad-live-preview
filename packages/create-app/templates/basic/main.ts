// Welcome to Manifold Studio!
// This is your main model file - customize it to create your own 3D designs

import { Manifold, P, createConfig } from "@manifold-studio/wrapper";
import { startConfigurator } from "@manifold-studio/configurator";

/**
 * Creates a parametric box with customizable dimensions and features
 */
function createParametricBox(
  width: number = 20,
  height: number = 15,
  depth: number = 10,
  wallThickness: number = 2,
  hasLid: boolean = true,
  cornerRadius: number = 1
): Manifold {
  // Create the outer box
  let outerBox = Manifold.cube([width, height, depth], true);
  
  // Add corner rounding if requested
  if (cornerRadius > 0) {
    // Simple rounding approximation - you can enhance this
    const roundingCylinder = Manifold.cylinder(depth + 2, cornerRadius, cornerRadius)
      .rotate([90, 0, 0]);
    
    // Apply rounding to corners (simplified version)
    outerBox = outerBox; // Placeholder for actual rounding logic
  }
  
  // Create the inner cavity
  const innerBox = Manifold.cube([
    width - wallThickness * 2,
    height - wallThickness * 2,
    depth - wallThickness
  ], true).translate([0, 0, wallThickness / 2]);
  
  // Subtract inner from outer to create walls
  let box = Manifold.difference(outerBox, innerBox);
  
  // Add lid if requested
  if (hasLid) {
    const lid = Manifold.cube([
      width - wallThickness,
      height - wallThickness,
      wallThickness
    ], true).translate([0, 0, depth / 2 + wallThickness / 2]);
    
    box = Manifold.union([box, lid]);
  }
  
  return box;
}

// Parametric configuration for the UI
const boxConfig = createConfig(
  {
    width: P.number(20, 10, 100, 1),
    height: P.number(15, 10, 100, 1),
    depth: P.number(10, 5, 50, 1),
    wallThickness: P.number(2, 1, 5, 0.5),
    hasLid: P.boolean(true),
    cornerRadius: P.number(1, 0, 5, 0.5)
  },
  (params) => createParametricBox(
    params.width,
    params.height,
    params.depth,
    params.wallThickness,
    params.hasLid,
    params.cornerRadius
  ),
  {
    name: "Parametric Box",
    description: "A customizable box with adjustable dimensions and features"
  }
);

// Start the configurator with your model
startConfigurator({
  models: {
    main: boxConfig
  },
  defaultModel: 'main'
});

// Export for potential use in other files
export default boxConfig;
export { createParametricBox };
