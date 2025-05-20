// src/lib/manifold.ts
/**
 * ManifoldCAD Synchronous API Module
 * 
 * This module provides synchronous access to ManifoldCAD operations by using the top-level await pattern.
 * The WASM module is loaded and initialized once when the application starts up, allowing all subsequent
 * operations to be performed synchronously.
 * 
 * Usage:
 * ```
 * import { Manifold, cube, sphere } from "../lib/manifold";
 * 
 * // Create a cube with a spherical hole
 * const box = Manifold.cube([20, 20, 20]);
 * const ball = Manifold.sphere(12);
 * const result = Manifold.difference(box, ball);
 * 
 * // Or use the function style
 * const anotherBox = cube([10, 10, 10]);
 * ```
 */

// Import the module constructor - it's a default export only, no named exports
import ManifoldModule from "manifold-3d";

// Define Vec3 type
export type Vec3 = [number, number, number];

/**
 * Type for the initialized Manifold module
 */
export type ManifoldType = Awaited<ReturnType<typeof ManifoldModule>>;

// Use top-level await to initialize the module
console.log("Initializing Manifold module (top-level await)...");
const manifoldModule = await ManifoldModule();
manifoldModule.setup();
console.log("Manifold module initialized successfully");

// Keeps track of the init count for informational purposes
let initCount = 1;

/**
 * Gets the current initialization count
 * @returns Number of times the module has been initialized (should always be 1)
 */
export function getInitCount(): number {
  return initCount;
}

/**
 * Export the main classes from the initialized module
 */
export const Manifold = manifoldModule.Manifold;
export const CrossSection = manifoldModule.CrossSection;

/**
 * Automatically export all utility functions
 * This approach dynamically exports all top-level functions that aren't classes
 */
export const utils = Object.fromEntries(
  Object.entries(manifoldModule)
    .filter(([key, value]) => typeof value === 'function' && key !== 'Manifold' && key !== 'CrossSection')
);

// Individually export each utility function
// We need to do this manually in ESM since "exports" isn't available
export const setMinCircularAngle = manifoldModule.setMinCircularAngle;
export const setMinCircularEdgeLength = manifoldModule.setMinCircularEdgeLength;
export const setCircularSegments = manifoldModule.setCircularSegments;
export const getCircularSegments = manifoldModule.getCircularSegments;
export const resetToCircularDefaults = manifoldModule.resetToCircularDefaults;

// VALIDATION: Check if our manual exports match all available utility functions
// This won't affect runtime but will log warnings during development
function validateUtilityExports() {
  const manualExports = [
    'setMinCircularAngle',
    'setMinCircularEdgeLength',
    'setCircularSegments',
    'getCircularSegments',
    'resetToCircularDefaults'
  ];
  
  const availableUtils = Object.keys(utils);
  
  // Check for missing exports
  const missingExports = availableUtils.filter(util => !manualExports.includes(util));
  if (missingExports.length > 0) {
    console.warn('⚠️ [manifold.ts] Some utility functions are not exported individually:');
    missingExports.forEach(name => console.warn(`  - Missing export: ${name}`));
  }
  
  // Check for exports that don't exist
  const nonexistentExports = manualExports.filter(name => !availableUtils.includes(name));
  if (nonexistentExports.length > 0) {
    console.warn('⚠️ [manifold.ts] Some exported utilities no longer exist in ManifoldModule:');
    nonexistentExports.forEach(name => console.warn(`  - Deprecated export: ${name}`));
  }
}

// Run validation in development but not in production
if (process.env.NODE_ENV !== 'production') {
  validateUtilityExports();
}

/**
 * Access to the raw ManifoldCAD module
 * Use this for advanced operations not covered by the basic API
 * @returns The initialized ManifoldCAD module
 */
export function getModule(): ManifoldType {
  return manifoldModule;
}

/**
 * For backward compatibility, keep the most common direct function exports
 */

/**
 * Creates a cube or cuboid with the specified dimensions
 * @param size The dimensions of the cube or a single number for equal dimensions
 * @param center Whether to center the cube at the origin (default: false)
 * @returns A new Manifold representing the cube
 */
export function cube(size: Readonly<Vec3> | number, center = false): any {
  return manifoldModule.Manifold.cube(size, center);
}

/**
 * Creates a cylinder with the specified dimensions
 * @param radius The radius of the cylinder
 * @param height The height of the cylinder
 * @param sides Number of sides for the cylinder (default: determined by circular defaults)
 * @returns A new Manifold representing the cylinder
 */
export function cylinder(radius: number, height: number, sides?: number): any {
  return manifoldModule.Manifold.cylinder(radius, height, sides);
}

/**
 * Creates a sphere with the specified radius
 * @param radius The radius of the sphere
 * @param resolution The resolution of the sphere (default: determined by circular defaults)
 * @returns A new Manifold representing the sphere
 */
export function sphere(radius: number, resolution?: number): any {
  return manifoldModule.Manifold.sphere(radius, resolution);
}

/**
 * Performs a union operation on multiple shapes
 * @param shapes Array of Manifold shapes to combine
 * @returns A new Manifold representing the union of all shapes
 * @throws Error if the shapes array is empty
 */
export function union(shapes: any[]): any {
  if (shapes.length === 0) throw new Error("Cannot union empty array");
  if (shapes.length === 1) return shapes[0];
  return manifoldModule.Manifold.union(shapes);
}

/**
 * Subtracts one shape from another
 * @param a The shape to subtract from
 * @param b The shape to subtract
 * @returns A new Manifold representing the difference (a - b)
 */
export function difference(a: any, b: any): any {
  if (!a || !b) return a;
  return manifoldModule.Manifold.difference(a, b);
}

/**
 * Finds the intersection of two shapes
 * @param a First shape
 * @param b Second shape
 * @returns A new Manifold representing the intersection of the shapes
 */
export function intersection(a: any, b: any): any {
  return manifoldModule.Manifold.intersection(a, b);
}

/**
 * Computes the convex hull of all points contained within a set of manifolds
 * @param manifolds Array of Manifold shapes or Vec3 points
 * @returns A new Manifold representing the convex hull of all shapes
 * @throws Error if the array is empty
 */
export function hull(manifolds: any[]): any {
  if (manifolds.length === 0) throw new Error("Cannot create hull from empty array");
  return manifoldModule.Manifold.hull(manifolds);
}

/**
 * Creates a factory object with all manifold operations
 * This provides an object-oriented API alternative to the functional approach
 * 
 * @returns An object with methods for all ManifoldCAD operations
 * 
 * @example
 * ```
 * const factory = createManifoldFactory();
 * const box = factory.cube([10, 10, 10]);
 * const sphere = factory.sphere(7);
 * const result = factory.difference(box, sphere);
 * ```
 */
export function createManifoldFactory() {
  return {
    // Simply return the Manifold class for backward compatibility
    ...manifoldModule.Manifold,
    
    // Add utility functions
    ...utils
  };
}