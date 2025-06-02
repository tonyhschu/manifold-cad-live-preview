// src/pipeline/core.ts
// Core pipeline utilities for model processing and parameter handling

import type { ParametricConfig } from '../types/parametric-config';

/**
 * Helper to determine if a model export is a parametric config
 */
export function isParametricConfig(obj: any): obj is ParametricConfig {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj === 'object' &&
    'parameters' in obj &&
    'generateModel' in obj &&
    typeof obj.generateModel === 'function'
  );
}

/**
 * Helper to extract default parameter values from ParametricConfig
 */
export function extractDefaultParams(config: ParametricConfig): Record<string, any> {
  const defaults: Record<string, any> = {};
  for (const [key, paramConfig] of Object.entries(config.parameters)) {
    defaults[key] = paramConfig.value;
  }
  return defaults;
}

/**
 * Helper to merge user parameters with defaults
 * @param defaults Default parameter values
 * @param userParams User-provided parameter overrides
 * @param options Configuration options
 * @returns Merged parameters with user overrides applied
 */
export function mergeParameters(
  defaults: Record<string, any>, 
  userParams: Record<string, any>,
  options: { logChanges?: boolean; onUnknownParam?: (key: string) => void } = {}
): Record<string, any> {
  const { logChanges = false, onUnknownParam } = options;
  const merged = { ...defaults };
  
  // Override with user-provided parameters
  for (const [key, value] of Object.entries(userParams)) {
    if (key in defaults) {
      merged[key] = value;
      if (logChanges) {
        console.log(`  ${key}: ${defaults[key]} → ${value}`);
      }
    } else {
      if (onUnknownParam) {
        onUnknownParam(key);
      } else {
        console.warn(`  Warning: Unknown parameter "${key}" ignored`);
      }
    }
  }
  
  return merged;
}

/**
 * Parse parameter string into typed values
 * Converts string values to appropriate types (number, boolean, string)
 * @param paramString Comma-separated key=value pairs
 * @returns Object with parsed parameter values
 */
export function parseParameterString(paramString: string): Record<string, any> {
  const params: Record<string, any> = {};
  
  if (!paramString || paramString.trim() === '') {
    return params;
  }
  
  paramString.split(',').forEach(pair => {
    const trimmedPair = pair.trim();
    if (!trimmedPair) return;
    
    const equalIndex = trimmedPair.indexOf('=');
    if (equalIndex === -1) {
      throw new Error(`Invalid parameter format: "${trimmedPair}". Expected format: key=value`);
    }
    
    const key = trimmedPair.substring(0, equalIndex).trim();
    const value = trimmedPair.substring(equalIndex + 1).trim();
    
    if (!key) {
      throw new Error(`Empty parameter key in: "${trimmedPair}"`);
    }
    
    // Try to parse as number, boolean, or keep as string
    params[key] = parseParameterValue(value);
  });
  
  return params;
}

/**
 * Parse a single parameter value to its appropriate type
 * @param value String value to parse
 * @returns Parsed value (number, boolean, or string)
 */
export function parseParameterValue(value: string): any {
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  // Handle empty string as string, not number
  if (value === '') return '';
  
  // Try to parse as number (including Infinity and -Infinity)
  const numValue = Number(value);
  if (!isNaN(numValue) && (isFinite(numValue) || value === 'Infinity' || value === '-Infinity')) {
    return numValue;
  }
  
  // Return as string
  return value;
}

/**
 * Validate that all required parameters are present
 * @param params Parameter object to validate
 * @param required Array of required parameter names
 * @throws Error if any required parameters are missing
 */
export function validateRequiredParameters(params: Record<string, any>, required: string[]): void {
  const missing = required.filter(key => !(key in params));
  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(', ')}`);
  }
}

/**
 * Get parameter information from a ParametricConfig
 * @param config ParametricConfig object
 * @returns Object with parameter metadata
 */
export function getParameterInfo(config: ParametricConfig): {
  names: string[];
  defaults: Record<string, any>;
  types: Record<string, string>;
} {
  const names = Object.keys(config.parameters);
  const defaults = extractDefaultParams(config);
  const types: Record<string, string> = {};
  
  for (const [key, paramConfig] of Object.entries(config.parameters)) {
    const value = paramConfig.value;
    if (typeof value === 'number') {
      types[key] = 'number';
    } else if (typeof value === 'boolean') {
      types[key] = 'boolean';
    } else if (typeof value === 'string') {
      // Check if it's a select parameter
      if ('options' in paramConfig) {
        types[key] = 'select';
      } else {
        types[key] = 'string';
      }
    } else {
      types[key] = 'unknown';
    }
  }
  
  return { names, defaults, types };
}
