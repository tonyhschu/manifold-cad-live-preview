// src/core/model-loader.ts
// Handles loading models from the models directory

/**
 * Interface for model metadata
 */
export interface ModelMetadata {
  name: string;
  description: string;
  author?: string;
  version?: string;
}

/**
 * Type definition for model creation functions
 * Notice we allow both synchronous and asynchronous model creation functions
 */
export type ModelCreator = () => Promise<any> | any;

/**
 * Available models in the system
 */
export const availableModels = [
  // Original async models
  { id: 'default', path: '../models/index', name: 'Demo Model (Async)' },
  { id: 'cube', path: '../models/simple-cube', name: 'Simple Cube (Async)' },
  { id: 'compound', path: '../models/compound-model', name: 'Compound Model (Async)' },
  
  // New synchronous models
  { id: 'sync-cube', path: '../models/sync-cube', name: 'Cube (Sync)' },
  { id: 'sync-demo', path: '../models/sync-demo', name: 'Demo Model (Sync)' },
  { id: 'sync-compound', path: '../models/sync-compound', name: 'Compound Model (Sync)' },
];

/**
 * Load the default model from the models directory
 * @returns Promise that resolves to the created model and its metadata
 */
export async function loadDefaultModel(): Promise<{ model: any; metadata?: ModelMetadata }> {
  return loadModelById('sync-demo'); // Default to a sync model
}

/**
 * Load a model by its ID
 * @param modelId The ID of the model to load
 * @returns Promise that resolves to the created model and its metadata
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
    
    // Create the model - handle both sync and async functions
    const modelResult = createModel();
    const model = modelResult instanceof Promise ? await modelResult : modelResult;
    
    return { model, metadata };
  } catch (error) {
    console.error(`Error loading model "${modelId}":`, error);
    throw error;
  }
}

/**
 * Get a list of all available models
 * @returns Array of model information
 */
export function getAvailableModels() {
  return availableModels.map(({ id, name }) => ({ id, name }));
}