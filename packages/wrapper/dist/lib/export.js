// src/lib/export.ts
// Export utilities for the Manifold API
import { manifoldToOBJ } from './export-core';
/**
 * Export a manifold to a simple OBJ format blob
 * @param model The manifold instance to export
 * @param options Export options (optional)
 * @returns A Blob containing the OBJ data
 * @throws Error if the model data is invalid
 */
export function exportToOBJ(model, _options) {
    try {
        // Use the pure function to get OBJ string
        const objContent = manifoldToOBJ(model);
        // Convert to blob (browser-specific)
        return new Blob([objContent], { type: "model/obj" });
    }
    catch (error) {
        throw error;
    }
}
// Re-export the pure function for direct use
export { manifoldToOBJ } from './export-core';
//# sourceMappingURL=export.js.map