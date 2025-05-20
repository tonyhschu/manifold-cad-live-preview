// src/lib/export.ts
// Export utilities for the Manifold API

/**
 * Export a manifold to a simple OBJ format blob
 */
export function exportToOBJ(model: any): Blob {
  try {
    // Get the mesh from the model
    const mesh = model.getMesh();
    
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

/**
 * Create a URL for a blob
 */
export function createModelUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}