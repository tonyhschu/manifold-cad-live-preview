/**
 * @manifold-studio/typeface
 * 
 * Font loading and text-to-3D conversion for Manifold Studio
 * 
 * This package provides clean font loading and text-to-3D conversion
 * for Manifold Studio components with lazy initialization support.
 * 
 * @example
 * ```typescript
 * import { fontLoader, fonts } from '@manifold-studio/typeface';
 * 
 * export default createConfig(
 *   { text: P.string('Hello') },
 *   async (params) => {
 *     await fonts.ensureReady();
 *     const renderText = fontLoader('Inter');
 *     return renderText(params.text).extrude(10);
 *   }
 * );
 * ```
 */

// Main API exports
export { fontLoader, registerFont, fonts } from './font-loader.js';

// Type exports for advanced usage
export type { TextRenderOptions } from './text-renderer.js';
export type { FontInfo, LoadedFont } from './font-resolver.js';

// Error exports
export { FontLoadError, FontTimeoutError } from './font-resolver.js';

// Default fonts list for reference
export { DEFAULT_FONTS } from './font-registry.js';
