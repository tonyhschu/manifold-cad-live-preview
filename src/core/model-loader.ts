// src/core/model-loader.ts
/**
 * Model Loader Module
 * 
 * This module handles the dynamic loading of models from the models directory.
 * It provides a registry of available models and functions to load them on demand.
 */

/**
 * Interface for model metadata
 * This metadata is used to provide information about the model in the UI
 */
export interface ModelMetadata {
  /** Display name for the model */
  name: string;
  /** Description of what the model represents */
  description: string;
  /** Optional author information */
  author?: string;
  /** Optional version information */
  version?: string;
}

/**
 * Type definition for model creation functions
 * Each model exports a function that creates and returns a Manifold object
 */
export type ModelCreator = () => any;

/**
 * Registry of all available models in the system
 * Each entry includes an ID, import path, and display name
 */
export const availableModels = [
  // Synchronous models
  { id: 'demo', path: '../models/demo', name: 'Demo Model' },
  { id: 'cube', path: '../models/cube', name: 'Simple Cube' },
  { id: 'compound', path: '../models/compound', name: 'Compound Model' },
];

/**
 * Load the default model from the models directory
 * @returns Promise that resolves to the created model and its metadata
 */
export async function loadDefaultModel(): Promise<{ model: any; metadata?: ModelMetadata }> {
  return loadModelById('demo');
}

/**
 * Load a model by its ID
 * This function:
 * 1. Finds the model definition in the registry
 * 2. Dynamically imports the model module
 * 3. Extracts the model creator function and metadata
 * 4. Creates the model
 * 5. Returns the model and its metadata
 * 
 * @param modelId The ID of the model to load from the availableModels registry
 * @returns Promise that resolves to the created model and its metadata
 * @throws Error if the model with the given ID is not found
 */
export async function loadModelById(modelId: string): Promise<{ model: any; metadata?: ModelMetadata }> {
  try {
    // Find the model definition
    const modelDef = availableModels.find(m => m.id === modelId);
    if (!modelDef) {
      throw new Error(`Model with ID "${modelId}" not found`);
    }
    
    // Import the model module
    const modelModule = await import(modelDef.path);
    
    // Get the model creator function (default export)
    const createModel = modelModule.default as ModelCreator;
    
    // Get metadata if available
    const metadata = modelModule.modelMetadata as ModelMetadata | undefined;
    
    // Create the model - all synchronous now
    const model = createModel();
    
    return { model, metadata };
  } catch (error) {
    console.error(`Error loading model "${modelId}":`, error);
    throw error;
  }
}

/**
 * Get a list of all available models
 * Used by the UI to populate the model selection dropdown
 * 
 * @returns Array of model information (id and name)
 */
export function getAvailableModels() {
  return availableModels.map(({ id, name }) => ({ id, name }));
}