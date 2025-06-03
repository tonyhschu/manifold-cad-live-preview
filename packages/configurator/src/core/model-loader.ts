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

import type { ParametricConfig } from '@manifold-studio/wrapper';

/**
 * Type definition for model creation functions
 * Each model exports a function that creates and returns a Manifold object
 */
export type ModelCreator = () => any;

/**
 * Type definition for parametric models
 * These export a ParametricConfig object instead of a simple function
 */
export type ParametricModel = ParametricConfig;

/**
 * Development-only registry for our internal models
 * This is used when running in development mode within the monorepo
 */
const developmentModels = [
  // Main model (follows user convention)
  { id: "main", path: "../../examples/main.js", name: "Parametric Hook", type: "parametric" as const },

  // Component models (in examples/components/ directory - follows user convention)
  { id: "demo", path: "../../examples/components/demo.js", name: "Demo Model", type: "static" as const },
  { id: "cube", path: "../../examples/components/cube.js", name: "Simple Cube", type: "static" as const },
  { id: "simple-hook", path: "../../examples/components/simple-hook.js", name: "Simple Hook", type: "static" as const },

  // Legacy models (still in models directory for backward compatibility)
  { id: "tracked-test", path: "../models/tracked-test", name: "Tracked Test", type: "static" as const },
  { id: "parametric-hook", path: "../models/parametric-hook", name: "Parametric Hook (Legacy)", type: "parametric" as const },
];

/**
 * Model registry entry interface
 */
export interface ModelRegistryEntry {
  id: string;
  path: string;
  name: string;
  type: 'static' | 'parametric';
}

/**
 * Check if we're running in development mode (within the monorepo)
 */
function isDevelopmentMode(): boolean {
  try {
    // Multiple checks to determine if we're in development mode:
    // 1. Vite dev mode
    // 2. URL contains configurator or packages (monorepo structure)
    // 3. Check if we have access to development models (fallback)
    const isViteDev = import.meta.env?.DEV === true;
    const isMonorepoPath = typeof window !== 'undefined' &&
                          (window.location.pathname.includes('configurator') ||
                           window.location.pathname.includes('packages'));

    // If we're in a test environment, also consider it development mode
    const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

    return isViteDev || isMonorepoPath || isTestEnv;
  } catch {
    // If we can't determine, assume development mode for safety
    return true;
  }
}

/**
 * Helper to determine if a model export is a parametric config
 */
function isParametricConfig(obj: any): obj is ParametricConfig {
  return (
    obj &&
    typeof obj === 'object' &&
    'parameters' in obj &&
    'generateModel' in obj &&
    typeof obj.generateModel === 'function'
  );
}

/**
 * Load the default model from the models directory
 * @returns Promise that resolves to the created model and its metadata
 */
export async function loadDefaultModel(): Promise<{
  model: any;
  metadata?: ModelMetadata;
  isParametric?: boolean;
  config?: ParametricConfig;
}> {
  if (isDevelopmentMode()) {
    return loadModelById("main");
  } else {
    // In generated projects, try to load main.js
    const models = await getAvailableModelsAsync();
    if (models.length === 0) {
      throw new Error('No models found. Please ensure you have a main.js file or models in a components/ directory.');
    }

    // Prefer 'main' model if it exists, otherwise use first available
    const defaultModel = models.find(m => m.id === 'main') || models[0];
    return loadModelById(defaultModel.id);
  }
}

/**
 * Load a model by its ID
 * This function:
 * 1. Finds the model definition in the registry
 * 2. Dynamically imports the model module
 * 3. Handles both static and parametric models
 * 4. For static models: creates the model immediately
 * 5. For parametric models: returns the config for UI setup
 *
 * @param modelId The ID of the model to load from the availableModels registry
 * @returns Promise that resolves to the model result
 * @throws Error if the model with the given ID is not found
 */
export async function loadModelById(
  modelId: string
): Promise<{
  model: any;
  metadata?: ModelMetadata;
  isParametric?: boolean;
  config?: ParametricConfig;
}> {
  try {
    // Find the model definition
    const modelDef = developmentModels.find((m) => m.id === modelId);
    if (!modelDef) {
      throw new Error(`Model with ID "${modelId}" not found`);
    }

    // Import the model module
    const modelModule = await import(modelDef.path);

    // Get the default export
    const defaultExport = modelModule.default;

    // Check if this is a parametric model
    if (isParametricConfig(defaultExport)) {
      // Parametric model - return the config for UI setup
      const config = defaultExport as ParametricConfig;

      // Generate initial model with default parameters
      const initialParams: Record<string, any> = {};
      for (const [key, paramConfig] of Object.entries(config.parameters)) {
        initialParams[key] = paramConfig.value;
      }
      const initialModel = config.generateModel(initialParams);

      return {
        model: initialModel,
        metadata: config.name ? {
          name: config.name,
          description: config.description || ""
        } : undefined,
        isParametric: true,
        config: config
      };
    } else {
      // Static model - execute the function
      const createModel = defaultExport as ModelCreator;
      if (typeof createModel !== 'function') {
        throw new Error(`createModel is not a function`);
      }

      // Get metadata if available
      const metadata = modelModule.modelMetadata as ModelMetadata | undefined;

      // Create the model
      const model = createModel();

      return {
        model,
        metadata,
        isParametric: false
      };
    }
  } catch (error) {
    console.error(`Error loading model "${modelId}":`, error);
    throw error;
  }
}

/**
 * Get a list of all available models
 * Used by the UI to populate the model selection dropdown
 *
 * @returns Array of model information (id, name, and type)
 */
export function getAvailableModels() {
  if (isDevelopmentMode()) {
    return developmentModels.map(({ id, name, type }) => ({ id, name, type }));
  } else {
    // In generated projects, we need async discovery
    // Return empty array for now - the async version should be used
    console.warn('getAvailableModels() called in generated project mode. Use getAvailableModelsAsync() instead.');
    return [];
  }
}

export async function getAvailableModelsAsync() {
  return developmentModels.map(({ id, name, type }) => ({ id, name, type }));
}
