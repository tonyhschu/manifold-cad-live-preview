/**
 * Path Utilities
 * 
 * Utility functions for handling file paths and model naming.
 * Extracted from V1 model-loader.ts for reuse in V3 pipeline compilation.
 */

/**
 * Extract model name from file path
 * 
 * Converts file paths to model IDs, handling the special case of main.ts
 * and ensuring unique IDs for nested components.
 * 
 * Examples:
 * - './main.ts' -> 'main'
 * - './components/wheel.ts' -> 'components/wheel'
 * - './assemblies/front-axle.ts' -> 'assemblies/front-axle'
 * - './nested/dir/model.ts' -> 'nested/dir/model'
 * 
 * @param filePath - File path to convert
 * @returns Model ID string
 */
export function extractModelName(filePath: string): string {
  // Remove leading './' and file extension
  const cleanPath = filePath.replace(/^\.\//, '').replace(/\.(ts|js)$/, '');

  // For main.ts, keep it simple
  if (cleanPath === 'main') {
    return 'main';
  }

  // For everything else, use the full path to avoid collisions
  return cleanPath;
}

/**
 * Convert model ID to display name
 * 
 * Converts kebab-case model IDs to human-readable display names.
 * Handles nested paths with proper capitalization.
 * 
 * Examples:
 * - 'main' -> 'Main'
 * - 'components/wheel' -> 'Components / Wheel'
 * - 'components/chassis-copy' -> 'Components / Chassis Copy'
 * 
 * @param modelId - Model ID to convert
 * @returns Human-readable display name
 */
export function modelIdToDisplayName(modelId: string): string {
  return modelId
    .split('/')
    .map(part => part.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '))
    .join(' / ');
}

/**
 * Convert file path to model ID (legacy compatibility)
 * 
 * Similar to extractModelName but with additional normalization
 * for special characters and spaces.
 * 
 * @param filePath - File path to convert
 * @returns Normalized model ID
 */
export function filePathToModelId(filePath: string): string {
  // Convert file path to model ID
  // e.g., "components/chassis copy.ts" -> "components/chassis-copy"
  return filePath
    .replace(/\.(ts|js)$/, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

/**
 * Check if a file path represents a model file
 * 
 * Determines if a given file path should be considered a model
 * based on its extension and location.
 * 
 * @param filePath - File path to check
 * @returns True if the file should be treated as a model
 */
export function isModelFile(filePath: string): boolean {
  // Must be TypeScript or JavaScript
  if (!/\.(ts|js)$/.test(filePath)) {
    return false;
  }

  // Skip certain directories
  if (filePath.includes('node_modules') || 
      filePath.includes('dist') || 
      filePath.includes('.git')) {
    return false;
  }

  return true;
}

/**
 * Get relative path from project root
 * 
 * Normalizes paths to be relative to the project root,
 * removing leading './' if present.
 * 
 * @param filePath - File path to normalize
 * @returns Normalized relative path
 */
export function normalizeRelativePath(filePath: string): string {
  return filePath.replace(/^\.\//, '');
}

/**
 * Get file extension from path
 * 
 * Extracts the file extension, including the dot.
 * 
 * @param filePath - File path
 * @returns File extension (e.g., '.ts', '.js') or empty string
 */
export function getFileExtension(filePath: string): string {
  const match = filePath.match(/\.[^.]+$/);
  return match ? match[0] : '';
}

/**
 * Get file name without extension
 * 
 * Extracts just the file name part without directory or extension.
 * 
 * @param filePath - File path
 * @returns File name without extension
 */
export function getFileNameWithoutExtension(filePath: string): string {
  const fileName = filePath.split('/').pop() || '';
  return fileName.replace(/\.[^.]+$/, '');
}
