// Simple hook component
// Example of a static model component

import { Manifold } from "@manifold-studio/wrapper";

/**
 * Creates a simple hook shape
 */
export default function createSimpleHook() {
  // Create the main body of the hook
  const body = Manifold.cube([20, 5, 5]).translate([0, 0, 0]);
  
  // Create the curved part
  const curve = Manifold.cylinder(10, 2.5, 2.5)
    .rotate([0, 90, 0])
    .translate([15, 0, 5]);
  
  // Create the mounting hole
  const hole = Manifold.cylinder(5, 2, 2)
    .rotate([90, 0, 0])
    .translate([-5, 0, 2.5]);
  
  // Combine the parts
  const hook = Manifold.union([body, curve]);
  const result = Manifold.difference(hook, hole);
  
  return result;
}

export const modelMetadata = {
  name: "Simple Hook",
  description: "A basic wall hook component"
};
