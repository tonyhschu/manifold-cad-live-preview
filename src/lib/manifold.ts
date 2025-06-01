// src/lib/manifold.ts
/**
 * ManifoldCAD Synchronous API Module
 *
 * This module provides synchronous access to ManifoldCAD operations by using the top-level await pattern.
 * The WASM module is loaded and initialized once when the application starts up, allowing all subsequent
 * operations to be performed synchronously.
 *
 * This library provides transparent access to the original ManifoldCAD API - no wrappers, no changes.
 * Just sync instead of async!
 *
 * Usage:
 * ```
 * import { Manifold } from "../lib/manifold";
 *
 * // Direct access to the original ManifoldCAD API, but synchronous!
 * const box = Manifold.cube([20, 20, 20]);
 * const ball = Manifold.sphere(12);
 * const result = Manifold.difference(box, ball);
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


// Direct re-exports of the main classes (transparent access)
export const OriginalManifold = manifoldModule.Manifold;
export const CrossSection = manifoldModule.CrossSection;

// Import the tracking utilities
import { createTrackedManifold } from './tracking/mm-manifold';

// Create the tracked Manifold after WASM is loaded
export const Manifold = createTrackedManifold(manifoldModule.Manifold);
export type Manifold = ReturnType<typeof createTrackedManifold>;

// Export a utils object containing ALL utility functions for discoverability
export const utils = Object.fromEntries(
  Object.entries(manifoldModule)
    .filter(([key, value]) => typeof value === 'function' && !['Manifold', 'CrossSection', 'setup'].includes(key))
);

// Manually export the most commonly used utility functions for direct access
export const setMinCircularAngle = manifoldModule.setMinCircularAngle;
export const setMinCircularEdgeLength = manifoldModule.setMinCircularEdgeLength;
export const setCircularSegments = manifoldModule.setCircularSegments;
export const getCircularSegments = manifoldModule.getCircularSegments;
export const resetToCircularDefaults = manifoldModule.resetToCircularDefaults;

// Export additional utility functions that users might need (if they exist)
export const triangulate = manifoldModule.triangulate;


/**
 * Access to the raw ManifoldCAD module
 * Use this for advanced operations not covered by the basic API
 * @returns The initialized ManifoldCAD module
 * @advanced This provides direct access to the WASM module - use with caution
 */
export function getModule(): ManifoldModuleType {
  return manifoldModule;
}

