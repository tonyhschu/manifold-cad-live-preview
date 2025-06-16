/**
 * Utilities Index
 * 
 * Central export point for all V3 utility functions.
 * Provides clean imports for other modules.
 */

// Model detection utilities
export {
  isParametricConfig,
  extractDefaultParams,
  validateModelExport,
  getModelNameFromExport,
  getModelDescriptionFromExport
} from './model-detection.js';

// Path utilities
export {
  extractModelName,
  modelIdToDisplayName,
  filePathToModelId,
  isModelFile,
  normalizeRelativePath,
  getFileExtension,
  getFileNameWithoutExtension
} from './path-utils.js';

// File discovery utilities
export {
  MODEL_GLOB_PATTERNS,
  discoverModelFiles,
  discoverModelFilesForCompilation,
  filterModelFiles,
  groupModelsByDirectory,
  sortModelsByPriority
} from './file-discovery.js';
