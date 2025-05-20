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
 */
export type ModelCreator = () => any;

/**
 * Available models in the system
 */
export const availableModels = [
  // Synchronous models
  { id: "demo", path: "../models/demo", name: "Demo Model" },
  { id: "cube", path: "../models/cube", name: "Simple Cube" },
  { id: "compound", path: "../models/compound", name: "Compound Model" },
];

/**
 * Load the default model from the models directory
 * @returns Promise that resolves to the created model and its metadata
 */
export async function loadDefaultModel(): Promise<{
  model: any;
  metadata?: ModelMetadata;
}> {
  return loadModelById("demo");
}

/**
 * Load a model by its ID
 * @param modelId The ID of the model to load
 * @returns Promise that resolves to the created model and its metadata
 */
export async function loadModelById(
  modelId: string
): Promise<{ model: any; metadata?: ModelMetadata }> {
  try {
    // Find the model definition
    const modelDef = availableModels.find((m) => m.id === modelId);
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
 * @returns Array of model information
 */
export function getAvailableModels() {
  return availableModels.map(({ id, name }) => ({ id, name }));
}
