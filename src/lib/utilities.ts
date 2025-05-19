// src/lib/utilities.ts
import { withModule } from './manifold-context';

/**
 * This module provides a simplified API for working with Manifold, 
 * ensuring everything goes through our singleton context
 */

// Helper to destructure everything we need from the Manifold module
async function getManifoldTools() {
  return withModule(module => {
    // Get static classes and methods
    const { Manifold, CrossSection, meshToGlb } = module;
    
    // Get static methods from Manifold class
    const { 
      cube, 
      cylinder, 
      sphere, 
      extrude, 
      revolve,
      union, 
      difference, 
      intersection
    } = Manifold;
    
    // Get utility functions
    const { 
      setMinCircularAngle,
      setMinCircularEdgeLength,
      setCircularSegments,
      getCircularSegments,
      resetToCircularDefaults
    } = module;
    
    return {
      Manifold,
      CrossSection,
      meshToGlb,
      cube,
      cylinder,
      sphere,
      extrude,
      revolve,
      union,
      difference,
      intersection,
      setMinCircularAngle,
      setMinCircularEdgeLength,
      setCircularSegments,
      getCircularSegments,
      resetToCircularDefaults
    };
  });
}

// Export all the key methods that use our context
export async function cube(size: number[], center = false) {
  const { cube } = await getManifoldTools();
  return cube(size, center);
}

export async function cylinder(radius: number, height: number, sides?: number) {
  const { cylinder } = await getManifoldTools();
  return cylinder(radius, height, sides);
}

export async function sphere(radius: number, resolution?: number) {
  const { sphere } = await getManifoldTools();
  return sphere(radius, resolution);
}

export async function union(shapes: any[]) {
  if (shapes.length === 0) return null;
  if (shapes.length === 1) return shapes[0];
  
  const { union } = await getManifoldTools();
  return union(shapes);
}

export async function difference(a: any, b: any) {
  if (!a || !b) return a;
  
  const { difference } = await getManifoldTools();
  return difference(a, b);
}

export async function intersection(a: any, b: any) {
  if (!a || !b) return null;
  
  const { intersection } = await getManifoldTools();
  return intersection(a, b);
}

export async function exportToGLB(model: any): Promise<Blob> {
  const { meshToGlb } = await getManifoldTools();
  
  // Get the mesh from the model
  const mesh = model.getMesh();
  
  // Use meshToGlb to convert the mesh to a GLB buffer
  const glb = meshToGlb(mesh);
  
  // Return as a blob
  return new Blob([glb], { type: 'application/octet-stream' });
}

// Create a URL for a GLB blob
export function createModelUrl(glbBlob: Blob): string {
  return URL.createObjectURL(glbBlob);
}

// Utility for creating a manifold context factory
export async function createManifoldFactory() {
  const tools = await getManifoldTools();
  
  return {
    // Primitives
    cube: tools.cube,
    cylinder: tools.cylinder,
    sphere: tools.sphere,
    extrude: tools.extrude,
    revolve: tools.revolve,
    
    // Boolean operations
    union: tools.union,
    difference: tools.difference,
    intersection: tools.intersection,
    
    // Export utilities
    exportToGLB: async (model: any): Promise<Blob> => {
      const mesh = model.getMesh();
      const glb = tools.meshToGlb(mesh);
      return new Blob([glb], { type: 'application/octet-stream' });
    },
    
    // Utility functions
    setMinCircularAngle: tools.setMinCircularAngle,
    setMinCircularEdgeLength: tools.setMinCircularEdgeLength,
    setCircularSegments: tools.setCircularSegments,
    getCircularSegments: tools.getCircularSegments,
    resetToCircularDefaults: tools.resetToCircularDefaults
  };
}
