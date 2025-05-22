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

// Define core types
export type Vec3 = [number, number, number];
export type Vec2 = [number, number];
export type Vec4 = [number, number, number, number];

/**
 * Result from mesh operations
 */
export interface MeshData {
  vertProperties: Float32Array;
  triVerts: Uint32Array;
  numProp: number;
}


/**
 * Parameters for primitive creation
 */
export interface CubeParams {
  size: Vec3 | number;
  center?: boolean;
}

export interface CylinderParams {
  radius: number;
  height: number;
  sides?: number;
}

export interface SphereParams {
  radius: number;
  resolution?: number;
}

/**
 * Type for the initialized Manifold module
 */
export type ManifoldModuleType = Awaited<ReturnType<typeof ManifoldModule>>;

// Use top-level await to initialize the module
const manifoldModule = await ManifoldModule();
manifoldModule.setup();

/**
 * Manifold class from the WASM module
 */
export type Manifold = InstanceType<typeof manifoldModule.Manifold>;

/**
 * CrossSection class from the WASM module  
 */
export type CrossSection = InstanceType<typeof manifoldModule.CrossSection>;

// Keeps track of the init count for informational purposes
let initCount = 1;

/**
 * Gets the current initialization count
 * @returns Number of times the module has been initialized (should always be 1)
 * @internal This is primarily for debugging and should not be relied upon in production
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


/**
 * Access to the raw ManifoldCAD module
 * Use this for advanced operations not covered by the basic API
 * @returns The initialized ManifoldCAD module
 * @advanced This provides direct access to the WASM module - use with caution
 */
export function getModule(): ManifoldModuleType {
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
export function cube(size: Readonly<Vec3> | number, center = false): Manifold {
  return manifoldModule.Manifold.cube(size, center);
}

/**
 * Creates a cylinder with the specified dimensions
 * @param radius The radius of the cylinder
 * @param height The height of the cylinder
 * @param sides Number of sides for the cylinder (default: determined by circular defaults)
 * @returns A new Manifold representing the cylinder
 */
export function cylinder(radius: number, height: number, sides?: number): Manifold {
  return manifoldModule.Manifold.cylinder(radius, height, sides);
}

/**
 * Creates a sphere with the specified radius
 * @param radius The radius of the sphere
 * @param resolution The resolution of the sphere (default: determined by circular defaults)
 * @returns A new Manifold representing the sphere
 */
export function sphere(radius: number, resolution?: number): Manifold {
  return manifoldModule.Manifold.sphere(radius, resolution);
}

/**
 * Performs a union operation on multiple shapes
 * @param shapes Array of Manifold shapes to combine
 * @returns A new Manifold representing the union of all shapes
 * @throws Error if the shapes array is empty
 */
export function union(shapes: Manifold[]): Manifold {
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
export function difference(a: Manifold, b: Manifold): Manifold {
  if (!a || !b) return a;
  return manifoldModule.Manifold.difference(a, b);
}

/**
 * Finds the intersection of two shapes
 * @param a First shape
 * @param b Second shape
 * @returns A new Manifold representing the intersection of the shapes
 */
export function intersection(a: Manifold, b: Manifold): Manifold {
  return manifoldModule.Manifold.intersection(a, b);
}

/**
 * Computes the convex hull of all points contained within a set of manifolds
 * @param manifolds Array of Manifold shapes or Vec3 points
 * @returns A new Manifold representing the convex hull of all shapes
 * @throws Error if the array is empty
 */
export function hull(manifolds: (Manifold | Vec3)[]): Manifold {
  if (manifolds.length === 0) throw new Error("Cannot create hull from empty array");
  return manifoldModule.Manifold.hull(manifolds);
}

/**
 * Creates a factory object with all manifold operations
 * This provides an object-oriented API alternative to the functional approach
 * 
 * @returns An object with methods for all ManifoldCAD operations
 * @deprecated Consider using the individual exported functions instead
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
    ...utils,
    
    // Add common shape functions to ensure TypeScript sees them
    sphere: (radius: number, resolution?: number) => manifoldModule.Manifold.sphere(radius, resolution),
    difference: (a: any, b: any) => manifoldModule.Manifold.difference(a, b)
  };
}