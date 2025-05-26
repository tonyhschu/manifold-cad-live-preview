// src/types/parameters.ts
/**
 * Parameter Schema Types for Automatic UI Generation
 * 
 * This module defines the schema types for model parameters that can be
 * automatically reflected into UI controls. Inspired by data exploration
 * filter UIs that adapt based on column types and statistical properties.
 */

/**
 * Base parameter definition that all parameter types extend
 */
export interface BaseParameter {
  /** Display name for the parameter in the UI */
  label: string;
  /** Optional description/tooltip text */
  description?: string;
  /** Whether this parameter is required */
  required?: boolean;
  /** Whether this parameter should be hidden in basic UI mode */
  advanced?: boolean;
}

/**
 * Numeric parameter with range and step controls
 */
export interface NumberParameter extends BaseParameter {
  type: 'number';
  /** Default value */
  default: number;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Step size for slider/spinner controls */
  step?: number;
  /** Number of decimal places to display */
  precision?: number;
  /** Unit of measurement for display */
  unit?: string;
}

/**
 * Integer parameter (subset of number with step=1)
 */
export interface IntegerParameter extends BaseParameter {
  type: 'integer';
  /** Default value */
  default: number;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Unit of measurement for display */
  unit?: string;
}

/**
 * Boolean parameter for on/off toggles
 */
export interface BooleanParameter extends BaseParameter {
  type: 'boolean';
  /** Default value */
  default: boolean;
}

/**
 * Enum parameter for selecting from a predefined list
 */
export interface EnumParameter<T = string> extends BaseParameter {
  type: 'enum';
  /** Default value (must be one of the options) */
  default: T;
  /** Available options */
  options: Array<{
    /** The actual value */
    value: T;
    /** Display label for this option */
    label: string;
    /** Optional description */
    description?: string;
  }>;
}

/**
 * String parameter for text input
 */
export interface StringParameter extends BaseParameter {
  type: 'string';
  /** Default value */
  default: string;
  /** Optional pattern for validation */
  pattern?: string;
  /** Maximum length */
  maxLength?: number;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Color parameter for color selection
 */
export interface ColorParameter extends BaseParameter {
  type: 'color';
  /** Default color value (hex, rgb, etc.) */
  default: string;
  /** Color format preference */
  format?: 'hex' | 'rgb' | 'hsl';
}

/**
 * Union type of all parameter types
 */
export type Parameter = 
  | NumberParameter 
  | IntegerParameter 
  | BooleanParameter 
  | EnumParameter<any>
  | StringParameter
  | ColorParameter;

/**
 * Schema definition for a model's parameters
 */
export interface ParameterSchema {
  /** Map of parameter names to their definitions */
  [parameterName: string]: Parameter;
}

/**
 * Runtime parameter values (what gets passed to the model function)
 */
export interface ParameterValues {
  [parameterName: string]: any;
}

/**
 * Parameter group for organizing related parameters
 */
export interface ParameterGroup {
  /** Group name/label */
  label: string;
  /** Optional description */
  description?: string;
  /** Parameters in this group */
  parameters: string[];
  /** Whether group starts collapsed */
  collapsed?: boolean;
}

/**
 * Complete parameter definition for a model
 */
export interface ModelParameterDefinition {
  /** Parameter schema */
  schema: ParameterSchema;
  /** Optional parameter grouping */
  groups?: ParameterGroup[];
  /** Overall description */
  description?: string;
}

/**
 * Helper function to extract default values from a schema
 */
export function getDefaultValues(schema: ParameterSchema): ParameterValues {
  const defaults: ParameterValues = {};
  
  for (const [name, param] of Object.entries(schema)) {
    defaults[name] = param.default;
  }
  
  return defaults;
}

/**
 * Helper function to validate parameter values against schema
 */
export function validateParameters(values: ParameterValues, schema: ParameterSchema): {
  valid: boolean;
  errors: Array<{ parameter: string; message: string }>;
} {
  const errors: Array<{ parameter: string; message: string }> = [];
  
  for (const [name, param] of Object.entries(schema)) {
    const value = values[name];
    
    // Check required parameters
    if (param.required && (value === undefined || value === null)) {
      errors.push({ parameter: name, message: `${param.label} is required` });
      continue;
    }
    
    // Skip validation if value is undefined and not required
    if (value === undefined || value === null) {
      continue;
    }
    
    // Type-specific validation
    switch (param.type) {
      case 'number':
      case 'integer':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push({ parameter: name, message: `${param.label} must be a number` });
        } else {
          if (param.min !== undefined && value < param.min) {
            errors.push({ parameter: name, message: `${param.label} must be at least ${param.min}` });
          }
          if (param.max !== undefined && value > param.max) {
            errors.push({ parameter: name, message: `${param.label} must be at most ${param.max}` });
          }
          if (param.type === 'integer' && !Number.isInteger(value)) {
            errors.push({ parameter: name, message: `${param.label} must be a whole number` });
          }
        }
        break;
        
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({ parameter: name, message: `${param.label} must be true or false` });
        }
        break;
        
      case 'enum':
        const validValues = param.options.map(opt => opt.value);
        if (!validValues.includes(value)) {
          errors.push({ parameter: name, message: `${param.label} must be one of: ${validValues.join(', ')}` });
        }
        break;
        
      case 'string':
        if (typeof value !== 'string') {
          errors.push({ parameter: name, message: `${param.label} must be text` });
        } else {
          if (param.maxLength && value.length > param.maxLength) {
            errors.push({ parameter: name, message: `${param.label} must be ${param.maxLength} characters or less` });
          }
          if (param.pattern && !new RegExp(param.pattern).test(value)) {
            errors.push({ parameter: name, message: `${param.label} has invalid format` });
          }
        }
        break;
        
      case 'color':
        if (typeof value !== 'string') {
          errors.push({ parameter: name, message: `${param.label} must be a color value` });
        }
        // Could add more sophisticated color validation here
        break;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}