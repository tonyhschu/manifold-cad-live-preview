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
import ManifoldModule from "manifold-3d";
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
declare const manifoldModule: import("manifold-3d").ManifoldToplevel;
/**
 * Original Manifold class from the WASM module
 */
export type OriginalManifoldType = InstanceType<typeof manifoldModule.Manifold>;
/**
 * CrossSection class from the WASM module
 */
export type CrossSectionType = InstanceType<typeof manifoldModule.CrossSection>;
/**
 * Gets the current initialization count
 * @returns Number of times the module has been initialized (should always be 1)
 * @internal This is primarily for debugging and should not be relied upon in production
 */
export declare function getInitCount(): number;
export declare const OriginalManifold: typeof import("manifold-3d/manifold-encapsulated-types").Manifold;
export declare const CrossSection: typeof import("manifold-3d/manifold-encapsulated-types").CrossSection;
import { createTrackedManifold } from './tracking/mm-manifold';
export declare const Manifold: any;
export type ManifoldType = ReturnType<typeof createTrackedManifold>;
export declare const utils: {
    [k: string]: any;
};
export declare const setMinCircularAngle: typeof import("manifold-3d/manifold-encapsulated-types").setMinCircularAngle;
export declare const setMinCircularEdgeLength: typeof import("manifold-3d/manifold-encapsulated-types").setMinCircularEdgeLength;
export declare const setCircularSegments: typeof import("manifold-3d/manifold-encapsulated-types").setCircularSegments;
export declare const getCircularSegments: typeof import("manifold-3d/manifold-encapsulated-types").getCircularSegments;
export declare const resetToCircularDefaults: typeof import("manifold-3d/manifold-encapsulated-types").resetToCircularDefaults;
export declare const triangulate: typeof import("manifold-3d/manifold-encapsulated-types").triangulate;
/**
 * Access to the raw ManifoldCAD module
 * Use this for advanced operations not covered by the basic API
 * @returns The initialized ManifoldCAD module
 * @advanced This provides direct access to the WASM module - use with caution
 */
export declare function getModule(): ManifoldModuleType;
export {};
//# sourceMappingURL=manifold.d.ts.map