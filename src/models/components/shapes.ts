// src/models/components/shapes.ts
// Reusable component library for shapes

import { 
  cube, 
  cylinder, 
  sphere, 
  difference, 
  intersection,
  union,
  getModule
} from "../../lib/manifold";

/**
 * Creates a simple hollowed cube
 */
export function hollowCube(size: number, wallThickness: number) {
  const outerCube = cube([size, size, size], true);
  const innerSize = size - (wallThickness * 2);
  
  if (innerSize <= 0) {
    // If the wall thickness is too large, just return a solid cube
    return outerCube;
  }
  
  const innerCube = cube([innerSize, innerSize, innerSize], true);
  return difference(outerCube, innerCube);
}

/**
 * Creates a simple cylinder with a hole through it
 */
export function cylinderWithHole(radius: number, height: number, holeRadius: number) {
  const outerCylinder = cylinder(radius, height, 32);
  
  if (holeRadius <= 0 || holeRadius >= radius) {
    // If the hole radius is invalid, just return a solid cylinder
    return outerCylinder;
  }
  
  const hole = cylinder(holeRadius, height + 1, 32); // Slightly taller to ensure complete hole
  return difference(outerCylinder, hole);
}

/**
 * Creates a spherical cap (a slice of a sphere)
 */
export function sphericalCap(radius: number, height: number) {
  const wholeSphere = sphere(radius, 32);
  const cutBox = cube([radius * 2, radius * 2, radius * 2 - height], true);
  
  // Translate the box to cut the bottom of the sphere
  // Access the raw module for transformations
  const module = getModule();
  const translatedBox = cutBox.translate([0, 0, -radius + (height / 2)]);
  
  return difference(wholeSphere, translatedBox);
}