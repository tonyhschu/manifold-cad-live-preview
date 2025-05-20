// src/models/components/shapes.ts
/**
 * Reusable Component Library for Basic Shapes
 * 
 * This module provides a collection of reusable 3D components for
 * creating common geometric structures. Each component is parameterized
 * to allow for customization.
 */

import { 
  cube, 
  cylinder, 
  sphere, 
  difference
} from "../../lib/manifold";

/**
 * Creates a hollowed cube with customizable size and wall thickness
 * 
 * @param size The outer dimensions of the cube
 * @param wallThickness The thickness of the cube walls
 * @returns A Manifold object representing a hollow cube
 * 
 * @example
 * const box = hollowCube(20, 2);
 */
export function hollowCube(size: number, wallThickness: number) {
  // Validate parameters
  if (size <= 0) {
    throw new Error("Size must be greater than 0");
  }
  if (wallThickness <= 0) {
    throw new Error("Wall thickness must be greater than 0");
  }

  // Create outer cube
  const outerCube = cube([size, size, size], true);
  
  // Calculate inner dimensions
  const innerSize = size - (wallThickness * 2);
  
  // If inner size is too small, return solid cube
  if (innerSize <= 0) {
    return outerCube;
  }
  
  // Create inner cube and subtract from outer cube
  const innerCube = cube([innerSize, innerSize, innerSize], true);
  return difference(outerCube, innerCube);
}

/**
 * Creates a cylinder with a hole through its center
 * 
 * @param radius The outer radius of the cylinder
 * @param height The height of the cylinder
 * @param holeRadius The radius of the hole
 * @returns A Manifold object representing a cylinder with a hole
 * 
 * @example
 * const tube = cylinderWithHole(10, 20, 5);
 */
export function cylinderWithHole(radius: number, height: number, holeRadius: number) {
  // Validate parameters
  if (radius <= 0) {
    throw new Error("Radius must be greater than 0");
  }
  if (height <= 0) {
    throw new Error("Height must be greater than 0");
  }
  if (holeRadius < 0) {
    throw new Error("Hole radius must be non-negative");
  }
  
  // Create outer cylinder
  const outerCylinder = cylinder(radius, height, 32);
  
  // If hole radius is 0 or larger than outer radius, return solid cylinder
  if (holeRadius <= 0 || holeRadius >= radius) {
    return outerCylinder;
  }
  
  // Create hole (slightly taller to ensure complete hole)
  const hole = cylinder(holeRadius, height + 1, 32);
  
  // Subtract hole from cylinder
  return difference(outerCylinder, hole);
}

/**
 * Creates a spherical cap (a slice of a sphere)
 * 
 * @param radius The radius of the sphere
 * @param height The height of the cap from the base
 * @returns A Manifold object representing a spherical cap
 * 
 * @example
 * const cap = sphericalCap(10, 5);
 */
export function sphericalCap(radius: number, height: number) {
  // Validate parameters
  if (radius <= 0) {
    throw new Error("Radius must be greater than 0");
  }
  if (height <= 0 || height > radius * 2) {
    throw new Error("Height must be greater than 0 and less than the sphere diameter");
  }
  
  // Create sphere
  const wholeSphere = sphere(radius, 32);
  
  // Create cutting box
  const cutBox = cube([radius * 2, radius * 2, radius * 2 - height], true);
  
  // Translate the box to cut the bottom of the sphere
  const translatedBox = cutBox.translate([0, 0, -radius + (height / 2)]);
  
  // Subtract box from sphere to create cap
  return difference(wholeSphere, translatedBox);
}