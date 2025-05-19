// src/lib/export-utils.ts
import { withManifold, manifoldContext } from './manifold-context';

// Export a manifold to GLB format
export async function exportToGLB(model: any): Promise<Blob> {
  console.log('Exporting model to GLB');
  // First, get the manifold module for meshToGlb
  const manifoldModule = await manifoldContext.getManifoldModule();
  
  // Get the mesh from the model
  const mesh = model.getMesh();
  
  // Use meshToGlb to convert the mesh to a GLB buffer
  const glb = manifoldModule.meshToGlb(mesh);
  
  // Return as a blob
  return new Blob([glb], { type: 'application/octet-stream' });
}

// Create a URL for a GLB blob
export function createModelUrl(glbBlob: Blob): string {
  return URL.createObjectURL(glbBlob);
}
