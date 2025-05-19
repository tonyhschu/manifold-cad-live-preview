// src/models/components/simple-shapes.ts
// Reusable component library for simple shapes

import { 
  cube, 
  cylinder, 
  sphere, 
  difference, 
  intersection, 
  union 
} from "../../lib/utilities";
import { manifoldContext } from "../../lib/manifold-context";

/**
 * Creates a simple hollowed cube
 * @param size The size of the cube
 * @param wallThickness The wall thickness
 * @returns A hollowed cube
 */
export async function hollowCube(size: number, wallThickness: number) {
  const outerCube = await cube([size, size, size], true);
  const innerSize = size - (wallThickness * 2);
  
  if (innerSize <= 0) {
    // If the wall thickness is too large, just return a solid cube
    return outerCube;
  }
  
  const innerCube = await cube([innerSize, innerSize, innerSize], true);
  return difference(outerCube, innerCube);
}

/**
 * Creates a simple cylinder with a hole through it
 * @param radius The radius of the cylinder
 * @param height The height of the cylinder
 * @param holeRadius The radius of the hole
 * @returns A cylinder with a hole
 */
export async function cylinderWithHole(radius: number, height: number, holeRadius: number) {
  const outerCylinder = await cylinder(radius, height, 32);
  
  if (holeRadius <= 0 || holeRadius >= radius) {
    // If the hole radius is invalid, just return a solid cylinder
    return outerCylinder;
  }
  
  const hole = await cylinder(holeRadius, height + 1, 32); // Slightly taller to ensure complete hole
  return difference(outerCylinder, hole);
}

/**
 * Creates a spherical cap (a slice of a sphere)
 * @param radius The radius of the sphere
 * @param height The height of the cap from the base
 * @returns A spherical cap
 */
export async function sphericalCap(radius: number, height: number) {
  const wholeSphere = await sphere(radius, 32);
  const cutBox = await cube([radius * 2, radius * 2, radius * 2 - height], true);
  
  // Translate the box to cut the bottom of the sphere
  const translatedBox = await withModule(module => {
    return cutBox.translate([0, 0, -radius + (height / 2)]);
  });
  
  return difference(wholeSphere, translatedBox);
}

/**
 * Helper function to use the module directly
 */
async function withModule<T>(callback: (module: any) => T): Promise<T> {
  const module = await manifoldContext.getModule();
  return callback(module);
}