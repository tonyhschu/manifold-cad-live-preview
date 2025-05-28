// src/lib/export-core.ts
// Pure export functions (environment-agnostic)

import type { Manifold } from './manifold';

/**
 * Export a manifold to OBJ format string
 * Pure function - no browser dependencies
 */
export function manifoldToOBJ(model: Manifold): string {
  const mesh = model.getMesh();
  const vertices = mesh.vertProperties;
  const triangles = mesh.triVerts;

  if (!vertices || !triangles) {
    throw new Error("Invalid mesh data for export");
  }

  const numVertices = vertices.length / 3;
  let objContent = "# Exported from Manifold\n";
  objContent += `# Vertices: ${numVertices}, Triangles: ${triangles.length / 3}\n`;
  objContent += `# Generated: ${new Date().toISOString()}\n\n`;

  // Add vertices
  for (let i = 0; i < vertices.length; i += 3) {
    objContent += `v ${vertices[i]} ${vertices[i + 1]} ${vertices[i + 2]}\n`;
  }

  // Add faces
  for (let i = 0; i < triangles.length; i += 3) {
    if (i + 2 < triangles.length &&
        triangles[i] < numVertices &&
        triangles[i + 1] < numVertices &&
        triangles[i + 2] < numVertices) {
      objContent += `f ${triangles[i] + 1} ${triangles[i + 1] + 1} ${triangles[i + 2] + 1}\n`;
    }
  }

  return objContent;
}