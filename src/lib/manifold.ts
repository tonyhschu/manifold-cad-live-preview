// src/lib/manifold.ts
// Provides synchronous access to Manifold after initial async loading

import ManifoldModule, { Manifold, Vec3 } from "manifold-3d";

// Type for the initialized Manifold module
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
 */
export function getInitCount(): number {
  return initCount;
}

/**
 * Access to the raw module
 */
export function getModule(): ManifoldType {
  return manifoldModule;
}

// Export primitive creation functions
export function cube(size: Readonly<Vec3> | number, center = false): Manifold {
  return manifoldModule.Manifold.cube(size, center);
}

export function cylinder(radius: number, height: number, sides?: number): Manifold {
  return manifoldModule.Manifold.cylinder(radius, height, sides);
}

export function sphere(radius: number, resolution?: number): Manifold {
  return manifoldModule.Manifold.sphere(radius, resolution);
}

// Export boolean operations
export function union(shapes: Manifold[]): Manifold {
  if (shapes.length === 0) throw new Error("Cannot union empty array");
  if (shapes.length === 1) return shapes[0];
  return manifoldModule.Manifold.union(shapes);
}

export function difference(a: Manifold, b: Manifold): Manifold {
  if (!a || !b) return a;
  return manifoldModule.Manifold.difference(a, b);
}

export function intersection(a: Manifold, b: Manifold): Manifold {
  return manifoldModule.Manifold.intersection(a, b);
}

// Create a factory with all manifold operations
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