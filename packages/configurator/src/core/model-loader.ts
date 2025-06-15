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
  loader?: () => Promise<any>; // Optional loader function for user project models
}

/**
 * Configuration for model discovery
 */
interface ModelDiscoveryConfig {
  /** Use hardcoded development models instead of file discovery */
  useDevelopmentModels?: boolean;
  /** Custom model registry to use instead of discovery */
  customModels?: ModelRegistryEntry[];
}

/**
 * Global configuration for model discovery
 * Can be set by the development environment or tests
 */
let modelDiscoveryConfig: ModelDiscoveryConfig = {
  useDevelopmentModels: false // Default to file discovery (customer-facing behavior)
};

/**
 * Configure model discovery behavior
 * This is primarily used by the development environment and tests
 */
export function configureModelDiscovery(config: ModelDiscoveryConfig) {
  modelDiscoveryConfig = { ...modelDiscoveryConfig, ...config };
}

/**
 * Check if we should use development models
 * This is now configuration-driven rather than environment-detection
 */
function shouldUseDevelopmentModels(): boolean {
  return modelDiscoveryConfig.useDevelopmentModels === true;
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
  // Always try to load main model first, regardless of environment
  const models = await getAvailableModelsAsync();
  if (models.length === 0) {
    throw new Error('No models found. Please ensure you have a main.ts file or models in a components/ directory.');
  }

  // Prefer 'main' model if it exists, otherwise use first available
  const defaultModel = models.find(m => m.id === 'main') || models[0];
  return loadModelById(defaultModel.id);
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
    // Get available models (this will use the appropriate discovery method)
    const availableModels = await getAvailableModelsAsync();

    // Find the model definition
    const modelDef = availableModels.find((m) => m.id === modelId);
    if (!modelDef) {
      throw new Error(`Model with ID "${modelId}" not found`);
    }

    // Import the model module
    let modelModule;
    if (modelDef.loader) {
      // Use the custom loader function for user project models
      console.log(`Loading model "${modelId}" using custom loader`);
      console.log(`🔍 DEBUG: Using custom loader (import.meta.glob)`);

      // CRITICAL: Custom loaders (import.meta.glob) are cached by Vite!
      // We need to force cache invalidation for HMR
      if (import.meta.env.DEV) {
        console.log(`🔄 DEV MODE: Attempting to force fresh load for custom loader`);
        // Unfortunately, we can't easily cache-bust import.meta.glob loaders
        // But we can try to invalidate the module cache
        try {
          // Force Vite to reload by clearing any internal caches
          if (import.meta.hot) {
            console.log(`🔄 Attempting HMR invalidation for custom loader`);
          }
        } catch (error) {
          console.warn('⚠️ Could not invalidate custom loader cache:', error);
        }
      }

      modelModule = await modelDef.loader();
    } else {
      // Use standard import for development models
      console.log(`Loading model "${modelId}" using standard import from ${modelDef.path}`);

      // Add cache-busting for HMR during development
      let importPath = modelDef.path;
      console.log(`🔍 DEBUG: Original modelDef.path: "${modelDef.path}"`);
      console.log(`🔍 DEBUG: import.meta.env.DEV: ${import.meta.env.DEV}`);

      if (import.meta.env.DEV) {
        // ALWAYS use cache-busting in development, with unique timestamp
        const timestamp = Date.now() + Math.random(); // Extra randomness
        const separator = importPath.includes('?') ? '&' : '?';
        importPath = `${importPath}${separator}t=${timestamp}&r=${Math.random()}`;
        console.log(`🔄 AGGRESSIVE cache-busting: ${importPath}`);
      } else {
        console.log(`🔍 DEBUG: Not in DEV mode, no cache-busting applied`);
      }

      console.log(`🔍 DEBUG: About to import from: ${importPath}`);
      modelModule = await import(importPath);
      console.log(`🔍 DEBUG: Import successful, module keys:`, Object.keys(modelModule));
    }

    // Get the default export
    const defaultExport = modelModule.default;
    console.log(`🔍 DEBUG: Default export type:`, typeof defaultExport);
    console.log(`🔍 DEBUG: Default export:`, defaultExport);

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
      console.log(`🔍 DEBUG: Processing static model "${modelId}"`);
      const createModel = defaultExport as ModelCreator;
      console.log(`🔍 DEBUG: createModel function:`, createModel);
      console.log(`🔍 DEBUG: createModel type:`, typeof createModel);

      if (typeof createModel !== 'function') {
        throw new Error(`createModel is not a function`);
      }

      // Get metadata if available
      const metadata = modelModule.modelMetadata as ModelMetadata | undefined;

      // Create the model
      console.log(`🔍 DEBUG: About to call createModel()`);
      const model = createModel();
      console.log(`🔍 DEBUG: createModel() returned:`, model);
      console.log(`🔍 DEBUG: Model type:`, typeof model);
      console.log(`🔍 DEBUG: Model constructor:`, model?.constructor?.name);

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
  // Check if we have custom models configured (for testing)
  if (modelDiscoveryConfig.customModels) {
    return modelDiscoveryConfig.customModels.map(({ id, name, type }) => ({ id, name, type }));
  }

  // Check if we should use development models (for monorepo development)
  if (shouldUseDevelopmentModels()) {
    return developmentModels.map(({ id, name, type }) => ({ id, name, type }));
  }

  // In generated projects, we need async discovery
  // Return empty array for now - the async version should be used
  console.warn('getAvailableModels() called in generated project mode. Use getAvailableModelsAsync() instead.');
  return [];
}

/**
 * Scan for user models in generated projects using Vite's import.meta.glob
 */
async function scanForUserModels(): Promise<ModelRegistryEntry[]> {
  const models: ModelRegistryEntry[] = [];

  try {
    // Use Vite's glob import to discover model files at build time
    const modelModules = import.meta.glob([
      './main.{ts,js}',
      './components/**/*.{ts,js}',
      './assemblies/**/*.{ts,js}',
      './**/*.{ts,js}',
      '!./node_modules/**',
      '!./dist/**',
      '!./src/**'
    ], {
      eager: false
    });

    console.log('🔍 Model Discovery: Found files:', Object.keys(modelModules));

    // Process each discovered file
    for (const [filePath, moduleLoader] of Object.entries(modelModules)) {
      try {
        // Extract model name from file path
        const modelId = extractModelName(filePath);

        // Skip if we already have this model (avoid duplicates)
        if (models.find(m => m.id === modelId)) {
          continue;
        }

        // Try to load the module to determine its type
        const module = await moduleLoader();
        const defaultExport = (module as any).default;

        // Determine model type and name
        let modelName = modelId;
        let modelType: 'static' | 'parametric' = 'static';

        if (isParametricConfig(defaultExport)) {
          modelType = 'parametric';
          modelName = defaultExport.name || modelId;
        }

        models.push({
          id: modelId,
          path: filePath,
          name: modelName,
          type: modelType
        });
      } catch (error) {
        console.warn(`Failed to process model file ${filePath}:`, error);
        // Continue processing other files
      }
    }
  } catch (error) {
    console.warn('Error during model discovery:', error);
  }

  console.log('🎯 Model Discovery: Final models:', models.map(m => m.id));
  return models;
}

/**
 * Set up HMR for model discovery
 * This ensures the model list refreshes when files are added/removed
 */
export function setupModelDiscoveryHMR(onRefresh?: () => void) {
  if (import.meta.hot) {
    console.log('🔥 Setting up Model Discovery HMR...');

    // Listen for any HMR updates and refresh model discovery
    import.meta.hot.on('vite:afterUpdate', (data) => {
      console.log('🔄 HMR afterUpdate detected, refreshing model discovery...', data);
      if (onRefresh) {
        onRefresh();
      }
    });

    // Also listen for file additions/removals specifically
    import.meta.hot.on('vite:beforeUpdate', (data) => {
      console.log('🔄 HMR beforeUpdate:', data);
    });

    // Listen for other HMR events
    import.meta.hot.on('vite:error', (data) => {
      console.log('❌ HMR error:', data);
    });

    console.log('✅ Model Discovery HMR setup complete');
  } else {
    console.log('❌ HMR not available - model discovery will not auto-refresh');
  }
}

/**
 * Extract model name from file path
 * Examples:
 * './main.ts' -> 'main'
 * './components/wheel.ts' -> 'components/wheel'
 * './assemblies/front-axle.ts' -> 'assemblies/front-axle'
 * './nested/dir/model.ts' -> 'nested/dir/model'
 */
function extractModelName(filePath: string): string {
  // Remove leading './' and file extension
  const cleanPath = filePath.replace(/^\.\//, '').replace(/\.(ts|js)$/, '');

  // For main.ts, keep it simple
  if (cleanPath === 'main') {
    return 'main';
  }

  // For everything else, use the full path to avoid collisions
  return cleanPath;
}

export async function getAvailableModelsAsync(): Promise<ModelRegistryEntry[]> {
  // Check if we have custom models configured (for testing)
  if (modelDiscoveryConfig.customModels) {
    return modelDiscoveryConfig.customModels;
  }

  // Check if we should use development models (for monorepo development)
  if (shouldUseDevelopmentModels()) {
    return developmentModels.map(({ id, name, type, path }) => ({ id, name, type, path }));
  }

  // Default behavior: scan for user models (customer-facing generated projects)
  return await scanForUserModels();
}
