// src/lib/export.ts
// Export utilities for the Manifold API

import type { Manifold } from './manifold';
import { manifoldToOBJ } from './export-core';

/**
 * Export result containing the blob and metadata
 */
export interface ExportResult {
  blob: Blob;
  filename: string;
  mimeType: string;
}

/**
 * Export options for different formats
 */
export interface ExportOptions {
  filename?: string;
  quality?: number;
}

/**
 * Export a manifold to a simple OBJ format blob
 * @param model The manifold instance to export
 * @param options Export options (optional)
 * @returns A Blob containing the OBJ data
 * @throws Error if the model data is invalid
 */
export function exportToOBJ(model: Manifold, _options?: ExportOptions): Blob {
  try {
    // Use the pure function to get OBJ string
    const objContent = manifoldToOBJ(model);
    
    // Convert to blob (browser-specific)
    return new Blob([objContent], { type: "model/obj" });
  } catch (error) {
    throw error;
  }
}

// Re-export the pure function for direct use
export { manifoldToOBJ } from './export-core';

