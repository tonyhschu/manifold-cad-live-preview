// src/lib/utilities.ts
import { Vec3 } from "manifold-3d";
import { withModule } from "./manifold-context";

/**
 * This module provides a simplified API for working with Manifold,
 * ensuring everything goes through our singleton context
 */

// Helper to destructure everything we need from the Manifold module
async function getManifoldTools() {
  return withModule((module) => {
    // Get static classes and methods
    const { Manifold, CrossSection } = module;

    // Get static methods from Manifold class
    const {
      cube,
      cylinder,
      sphere,
      extrude,
      revolve,
      union,
      difference,
      intersection,
    } = Manifold;

    // Get utility functions
    const {
      setMinCircularAngle,
      setMinCircularEdgeLength,
      setCircularSegments,
      getCircularSegments,
      resetToCircularDefaults,
    } = module;

    return {
      Manifold,
      CrossSection,
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
      resetToCircularDefaults,
    };
  });
}

// Export all the key methods that use our context
export async function cube(size: Readonly<Vec3> | number, center = false) {
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

// Export a manifold to a simple OBJ format blob
export async function exportToOBJ(model: any): Promise<Blob> {
  console.log("Exporting model to OBJ");

  try {
    // Get the mesh from the model
    const mesh = model.getMesh();
    console.log("Got mesh:", mesh);

    // Log detailed mesh properties
    console.log("Mesh properties:", {
      numProp: mesh.numProp,
      triVertsLength: mesh.triVerts.length,
      vertPropertiesLength: mesh.vertProperties.length,
      numVertices: mesh.vertProperties.length / mesh.numProp,
      // Log first few vertices and triangles
      sampleVertices: Array.from(mesh.vertProperties.slice(0, 15)),
      sampleTriangles: Array.from(mesh.triVerts.slice(0, 15)),
    });

    // Extract vertices and triangles
    const positions = mesh.vertProperties;
    const triangles = mesh.triVerts;

    // Validate the data
    if (
      !positions ||
      !triangles ||
      positions.length === 0 ||
      triangles.length === 0
    ) {
      throw new Error("Invalid mesh data for export");
    }

    const numComponents = mesh.numProp || 3; // Default to 3 if not specified
    const numVertices = positions.length / numComponents;

    // Build OBJ format string
    let objContent = "# Exported from Manifold\n";
    objContent += `# Vertices: ${numVertices}, Triangles: ${
      triangles.length / 3
    }\n`;
    objContent += `# Generated: ${new Date().toISOString()}\n\n`;

    // Add vertices - each vertex has numComponents (usually 3 for position)
    for (let i = 0; i < numVertices; i++) {
      const baseIdx = i * numComponents;
      // Ensure we don't go out of bounds
      if (baseIdx + 2 < positions.length) {
        objContent += `v ${positions[baseIdx]} ${positions[baseIdx + 1]} ${
          positions[baseIdx + 2]
        }\n`;
      }
    }

    // Add faces (triangles)
    for (let i = 0; i < triangles.length; i += 3) {
      // Ensure indices are in bounds and valid
      if (
        i + 2 < triangles.length &&
        triangles[i] < numVertices &&
        triangles[i + 1] < numVertices &&
        triangles[i + 2] < numVertices
      ) {
        // OBJ uses 1-based indexing
        objContent += `f ${triangles[i] + 1} ${triangles[i + 1] + 1} ${
          triangles[i + 2] + 1
        }\n`;
      }
    }

    // Return as a blob
    return new Blob([objContent], { type: "text/plain" });
  } catch (error) {
    console.error("Error exporting to OBJ:", error);
    // Return a minimal valid OBJ in case of error
    return new Blob(
      ["# Error exporting model\nv 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n"],
      { type: "text/plain" }
    );
  }
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
    exportToOBJ: async (model: any): Promise<Blob> => {
      try {
        const mesh = model.getMesh();

        // Extract vertices and triangles
        const positions = mesh.vertProperties;
        const triangles = mesh.triVerts;

        // Log properties for debugging
        console.log("Factory export - Mesh properties:", {
          numProp: mesh.numProp,
          vertPropertiesLength: mesh.vertProperties.length,
        });

        // Validate the data
        if (
          !positions ||
          !triangles ||
          positions.length === 0 ||
          triangles.length === 0
        ) {
          throw new Error("Invalid mesh data for export");
        }

        const numComponents = mesh.numProp || 3; // Default to 3 if not specified
        const numVertices = positions.length / numComponents;

        // Build OBJ format string
        let objContent = "# Exported from Manifold\n";
        objContent += `# Vertices: ${numVertices}, Triangles: ${
          triangles.length / 3
        }\n`;
        objContent += `# Generated: ${new Date().toISOString()}\n\n`;

        // Add vertices - each vertex has numComponents (usually 3 for position)
        for (let i = 0; i < numVertices; i++) {
          const baseIdx = i * numComponents;
          // Ensure we don't go out of bounds
          if (baseIdx + 2 < positions.length) {
            objContent += `v ${positions[baseIdx]} ${positions[baseIdx + 1]} ${
              positions[baseIdx + 2]
            }\n`;
          }
        }

        // Add faces (triangles)
        for (let i = 0; i < triangles.length; i += 3) {
          // Ensure indices are in bounds and valid
          if (
            i + 2 < triangles.length &&
            triangles[i] < numVertices &&
            triangles[i + 1] < numVertices &&
            triangles[i + 2] < numVertices
          ) {
            // OBJ uses 1-based indexing
            objContent += `f ${triangles[i] + 1} ${triangles[i + 1] + 1} ${
              triangles[i + 2] + 1
            }\n`;
          }
        }

        // Return as a blob
        return new Blob([objContent], { type: "text/plain" });
      } catch (error) {
        console.error("Error exporting to OBJ from factory:", error);
        // Return a minimal valid OBJ in case of error
        return new Blob(
          ["# Error exporting model\nv 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n"],
          { type: "text/plain" }
        );
      }
    },

    // Utility functions
    setMinCircularAngle: tools.setMinCircularAngle,
    setMinCircularEdgeLength: tools.setMinCircularEdgeLength,
    setCircularSegments: tools.setCircularSegments,
    getCircularSegments: tools.getCircularSegments,
    resetToCircularDefaults: tools.resetToCircularDefaults,
  };
}
