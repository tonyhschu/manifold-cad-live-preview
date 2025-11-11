/**
 * Model Detection Utilities
 * 
 * Utility functions for detecting and analyzing model types.
 * Extracted from V1 model-loader.ts for reuse in V3 pipeline compilation.
 */

import type { ParametricConfig } from '@manifold-studio/wrapper';
import { 
  isParametricConfig as _isParametricConfig, 
  extractDefaultParams as _extractDefaultParams 
} from '../pipeline-runtime/types.js';

/**
 * Helper to determine if a model export is a parametric config
 * 
 * This is the core detection logic that determines whether a model
 * is static (function-based) or parametric (config-based).
 * 
 * Re-exported from pipeline-runtime/types.ts to maintain API compatibility.
 * 
 * @param obj - The default export from a model module
 * @returns True if the object is a ParametricConfig
 */
export const isParametricConfig = _isParametricConfig;

/**
 * Extract default parameters from a parametric config
 * 
 * Creates a parameter object with all default values from the config.
 * Used for initial model generation and testing.
 * 
 * Re-exported from pipeline-runtime/types.ts to maintain API compatibility.
 * 
 * @param config - Parametric configuration object
 * @returns Object with parameter names as keys and default values
 */
export const extractDefaultParams = _extractDefaultParams;

/**
 * Validate that a model export is valid
 * 
 * Checks that the default export is either a function (static model)
 * or a valid parametric config.
 * 
 * @param defaultExport - The default export from a model module
 * @returns Object with validation result and type information
 */
export function validateModelExport(defaultExport: any): {
  isValid: boolean;
  type: 'static' | 'parametric' | 'invalid';
  error?: string;
} {
  if (!defaultExport) {
    return {
      isValid: false,
      type: 'invalid',
      error: 'No default export found'
    };
  }

  // Check for parametric config
  if (isParametricConfig(defaultExport)) {
    return {
      isValid: true,
      type: 'parametric'
    };
  }

  // Check for static function
  if (typeof defaultExport === 'function') {
    return {
      isValid: true,
      type: 'static'
    };
  }

  return {
    isValid: false,
    type: 'invalid',
    error: 'Export must be either a function or ParametricConfig object'
  };
}

/**
 * Get model name from export
 * 
 * Extracts the display name from a model export, preferring
 * explicit names from parametric configs.
 * 
 * @param defaultExport - The default export from a model module
 * @param fallbackName - Fallback name if none found in export
 * @returns Display name for the model
 */
export function getModelNameFromExport(defaultExport: any, fallbackName: string): string {
  if (isParametricConfig(defaultExport) && defaultExport.name) {
    return defaultExport.name;
  }
  
  return fallbackName;
}

/**
 * Get model description from export
 * 
 * Extracts the description from a model export.
 * 
 * @param defaultExport - The default export from a model module
 * @returns Description string or empty string if none found
 */
export function getModelDescriptionFromExport(defaultExport: any): string {
  if (isParametricConfig(defaultExport) && defaultExport.description) {
    return defaultExport.description;
  }
  
  return '';
}
