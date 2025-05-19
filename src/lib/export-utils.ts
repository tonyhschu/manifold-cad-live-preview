// src/lib/export-utils.ts
import { withManifold } from './manifold-context';

// Export a manifold to GLB format
export async function exportToGLB(model: any): Promise<Blob> {
  console.log('Exporting model to GLB');
  return withManifold(manifold => {
    const mesh = model.getMesh();
    const glb = manifold.meshToGlb(mesh);
    return new Blob([glb], { type: 'application/octet-stream' });
  });
}

// Create a URL for a GLB blob
export function createModelUrl(glbBlob: Blob): string {
  return URL.createObjectURL(glbBlob);
}
