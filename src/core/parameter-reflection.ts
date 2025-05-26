// src/core/parameter-reflection.ts
/**
 * Parameter Reflection API
 * 
 * This module provides utilities for discovering and working with model parameters
 * through reflection on model functions and their associated parameter schemas.
 */

import type { 
  ModelParameterDefinition, 
  ParameterValues
} from '../types/parameters';

import { 
  getDefaultValues,
  validateParameters
} from '../types/parameters';

/**
 * Enhanced model creator function with parameter schema
 */
export interface ParametricModelCreator {
  /** The model creation function */
  (params?: ParameterValues): any;
  /** Parameter schema attached to the function */
  parameters?: ModelParameterDefinition;
}

/**
 * Model module with parameter support
 */
export interface ParametricModelModule {
  /** Default export: the model creator function */
  default: ParametricModelCreator;
  /** Named export: parameter definition */
  parameters?: ModelParameterDefinition;
  /** Existing metadata */
  modelMetadata?: {
    name: string;
    description: string;
    author?: string;
    version?: string;
  };
}

/**
 * Result of parameter discovery for a model
 */
export interface ModelParameterInfo {
  /** Model ID */
  modelId: string;
  /** Whether the model supports parameters */
  hasParameters: boolean;
  /** Parameter definition (if available) */
  parameterDefinition?: ModelParameterDefinition;
  /** Default parameter values */
  defaultValues: ParameterValues;
  /** Whether the model function accepts a parameters argument */
  acceptsParameters: boolean;
}

/**
 * Discover parameter information for a model
 */
export async function discoverModelParameters(modelId: string): Promise<ModelParameterInfo> {
  try {
    // Import the model module dynamically
    const modelModule = await importModelModule(modelId);
    
    if (!modelModule) {
      return {
        modelId,
        hasParameters: false,
        defaultValues: {},
        acceptsParameters: false
      };
    }
    
    // Check for parameter definition on the function or as named export
    const parameterDefinition = modelModule.default.parameters || modelModule.parameters;
    
    // Check if the function accepts parameters by examining its signature
    const acceptsParameters = modelModule.default.length > 0;
    
    // Extract default values
    const defaultValues = parameterDefinition 
      ? getDefaultValues(parameterDefinition.schema)
      : {};
    
    return {
      modelId,
      hasParameters: !!parameterDefinition,
      parameterDefinition,
      defaultValues,
      acceptsParameters
    };
    
  } catch (error) {
    console.warn(`Failed to discover parameters for model ${modelId}:`, error);
    return {
      modelId,
      hasParameters: false,
      defaultValues: {},
      acceptsParameters: false
    };
  }
}

/**
 * Create a model with specific parameter values
 */
export async function createModelWithParameters(
  modelId: string, 
  parameterValues: ParameterValues = {}
): Promise<{
  model: any;
  usedParameters: ParameterValues;
  validation: { valid: boolean; errors: Array<{ parameter: string; message: string }> };
}> {
  const parameterInfo = await discoverModelParameters(modelId);
  
  // Merge provided values with defaults
  const finalParameters = {
    ...parameterInfo.defaultValues,
    ...parameterValues
  };
  
  // Validate parameters if schema is available
  let validation: { valid: boolean; errors: Array<{ parameter: string; message: string }> } = { valid: true, errors: [] };
  if (parameterInfo.parameterDefinition) {
    validation = validateParameters(finalParameters, parameterInfo.parameterDefinition.schema);
  }
  
  // Load and create the model
  const modelModule = await importModelModule(modelId);
  if (!modelModule) {
    throw new Error(`Model ${modelId} not found`);
  }
  
  // Create the model with parameters
  const model = parameterInfo.acceptsParameters 
    ? modelModule.default(finalParameters)
    : modelModule.default();
  
  return {
    model,
    usedParameters: finalParameters,
    validation
  };
}

/**
 * Get all models that support parameters
 */
export async function getParametricModels(): Promise<ModelParameterInfo[]> {
  const { availableModels } = await import('./model-loader');
  
  const parameterInfoPromises = availableModels.map(({ id }) => 
    discoverModelParameters(id)
  );
  
  const allParameterInfo = await Promise.all(parameterInfoPromises);
  
  // Return only models that have parameters
  return allParameterInfo.filter(info => info.hasParameters);
}

/**
 * Helper to import a model module
 */
async function importModelModule(modelId: string): Promise<ParametricModelModule | null> {
  try {
    const { availableModels } = await import('./model-loader');
    
    const modelDef = availableModels.find(m => m.id === modelId);
    if (!modelDef) {
      return null;
    }
    
    const modelModule = await import(modelDef.path) as ParametricModelModule;
    return modelModule;
    
  } catch (error) {
    console.warn(`Failed to import model ${modelId}:`, error);
    return null;
  }
}

/**
 * Utility to attach parameters to a model function
 */
export function withParameters<T extends Function>(
  modelFunction: T,
  parameterDefinition: ModelParameterDefinition
): T & { parameters: ModelParameterDefinition } {
  (modelFunction as any).parameters = parameterDefinition;
  return modelFunction as T & { parameters: ModelParameterDefinition };
}

/**
 * Helper to create parameter schema more easily
 */
export const param = {
  number: (options: Omit<import('../types/parameters').NumberParameter, 'type'>): import('../types/parameters').NumberParameter => ({
    type: 'number',
    ...options
  }),
  
  integer: (options: Omit<import('../types/parameters').IntegerParameter, 'type'>): import('../types/parameters').IntegerParameter => ({
    type: 'integer',
    ...options
  }),
  
  boolean: (options: Omit<import('../types/parameters').BooleanParameter, 'type'>): import('../types/parameters').BooleanParameter => ({
    type: 'boolean',
    ...options
  }),
  
  enum: <T>(options: Omit<import('../types/parameters').EnumParameter<T>, 'type'>): import('../types/parameters').EnumParameter<T> => ({
    type: 'enum',
    ...options
  }),
  
  string: (options: Omit<import('../types/parameters').StringParameter, 'type'>): import('../types/parameters').StringParameter => ({
    type: 'string',
    ...options
  }),
  
  color: (options: Omit<import('../types/parameters').ColorParameter, 'type'>): import('../types/parameters').ColorParameter => ({
    type: 'color',
    ...options
  })
};