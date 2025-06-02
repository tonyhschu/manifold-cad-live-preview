import type { ManifoldType } from './manifold';
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
export declare function exportToOBJ(model: ManifoldType, _options?: ExportOptions): Blob;
export { manifoldToOBJ } from './export-core';
//# sourceMappingURL=export.d.ts.map