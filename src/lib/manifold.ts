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
 * import { cube, sphere, difference } from "../lib/manifold";
 * 
 * // Create a cube with a spherical hole
 * const box = cube([20, 20, 20]);
 * const ball = sphere(12);
 * const result = difference(box, ball);
 * ```
 */

import ManifoldModule, { Manifold, Vec3 } from "manifold-3d";

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
 * Access to the raw ManifoldCAD module
 * Use this for advanced operations not covered by the basic API
 * @returns The initialized ManifoldCAD module
 */
export function getModule(): ManifoldType {
  return manifoldModule;
}

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
    // Primitives
    cube: manifoldModule.Manifold.cube,
    cylinder: manifoldModule.Manifold.cylinder,
    sphere: manifoldModule.Manifold.sphere,
    extrude: manifoldModule.Manifold.extrude,
    revolve: manifoldModule.Manifold.revolve,

    // Boolean operations
    union: manifoldModule.Manifold.union,
    difference: manifoldModule.Manifold.difference,
    intersection: manifoldModule.Manifold.intersection,

    // Utility functions
    setMinCircularAngle: manifoldModule.setMinCircularAngle,
    setMinCircularEdgeLength: manifoldModule.setMinCircularEdgeLength,
    setCircularSegments: manifoldModule.setCircularSegments,
    getCircularSegments: manifoldModule.getCircularSegments,
    resetToCircularDefaults: manifoldModule.resetToCircularDefaults,
  };
}