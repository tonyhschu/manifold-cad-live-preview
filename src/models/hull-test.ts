// src/models/hull-test.ts
// Test model for the hull operation

import { Manifold, Vec3, hull } from "../lib/manifold";

/**
 * Creates and returns a 3D model using the hull operation
 */
export default function createModel() {
  console.log("Creating model with Hull operation");

  // Create several primitive shapes at different positions
  const shapes = [
    Manifold.cube([4, 4, 4]).translate([10, 0, 0] as Vec3),
    Manifold.sphere(3).translate([0, 10, 0] as Vec3),
    Manifold.cylinder(2, 6).translate([0, 0, 10] as Vec3),
    Manifold.cube([2, 2, 8]).translate([-8, -8, 0] as Vec3)
  ];

  // Log each shape
  shapes.forEach((_, i) => console.log(`Shape ${i} created`));

  // Create a hull around all shapes
  console.log("Computing convex hull of all shapes...");
  
  // Try both the class method and the function
  let hullModel;
  
  try {
    // First try using the class method
    if (typeof Manifold.hull === 'function') {
      console.log("Using Manifold.hull class method");
      hullModel = Manifold.hull(shapes);
    } else {
      // Fall back to the function if the class method isn't available
      console.log("Using hull function");
      hullModel = hull(shapes);
    }
    console.log("Hull computed successfully");
  } catch (error) {
    console.error("Error computing hull:", error);
    // If hull fails, return a simple union as fallback
    hullModel = Manifold.union(shapes);
    console.log("Falling back to union operation");
  }

  // Return the hull model
  return hullModel;
}

// Model metadata
export const modelMetadata = {
  name: "Hull Test",
  description: "A demonstration of the convex hull operation",
  author: "ManifoldCAD Team",
  version: "1.0.0",
};