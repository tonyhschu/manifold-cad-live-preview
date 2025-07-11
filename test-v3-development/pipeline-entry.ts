/**
 * Pipeline Entry Point
 *
 * This file is built by Vite to create the pipeline.js output.
 * It discovers and compiles all models into a single pipeline object.
 */

// Import model files directly - Vite will handle the bundling
// Use namespace imports to get both default export and named exports (like modelMetadata)
import mainModel from './main.ts';
import * as simpleCubeModule from './components/simple-cube.ts';
import wheelModel from './components/wheel.ts';

// Type definitions for better type safety
interface ParametricConfig {
  name: string;
  description?: string;
  parameters: Record<string, { value: any; min?: any; max?: any; }>;
  generateModel: (params: any) => any;
}

interface ParametricModel {
  id: string;
  name: string;
  type: 'parametric';
  config: ParametricConfig;
  defaultParams: Record<string, any>;
}

interface StaticModel {
  id: string;
  name: string;
  type: 'static';
  createFunction: () => any;
  metadata?: {
    name?: string;
    description?: string;
    author?: string;
  };
}

type ProcessedModel = ParametricModel | StaticModel;

// Utility functions (copied locally to avoid import issues)
function isParametricConfig(obj: any): obj is ParametricConfig {
  return (
    obj &&
    typeof obj === 'object' &&
    'parameters' in obj &&
    'generateModel' in obj &&
    typeof obj.generateModel === 'function'
  );
}

function extractDefaultParams(config: ParametricConfig): Record<string, any> {
  const defaultParams: Record<string, any> = {};

  for (const [key, paramConfig] of Object.entries(config.parameters)) {
    defaultParams[key] = paramConfig.value;
  }

  return defaultParams;
}

// Define the models that were discovered
const modelDefinitions = [
  { id: 'main', path: './main.ts', module: mainModel },
  { id: 'components/simple-cube', path: './components/simple-cube.ts', module: simpleCubeModule },
  { id: 'components/wheel', path: './components/wheel.ts', module: wheelModel }
];

// Process each model and create the pipeline
const processedModels: ProcessedModel[] = modelDefinitions.map(({ id, path, module }) => {
  // Handle both default imports and namespace imports
  const defaultExport = (module as any).default || module;

  if (isParametricConfig(defaultExport)) {
    // Parametric model
    return {
      id,
      name: defaultExport.name || id,
      type: 'parametric' as const,
      config: defaultExport,
      defaultParams: extractDefaultParams(defaultExport)
    } as ParametricModel;
  } else if (typeof defaultExport === 'function') {
    // Static model - extract metadata if available
    const metadata = module.modelMetadata || {};
    return {
      id,
      name: metadata.name || id,
      type: 'static' as const,
      createFunction: defaultExport,
      metadata: metadata
    } as StaticModel;
  } else {
    throw new Error(`Invalid model export in ${path}`);
  }
});

// Create the pipeline object first (so we can reference it in manifestData)
export const pipeline = {
  getAvailableModels() {
    return processedModels.map(model => ({
      id: model.id,
      name: model.name,
      type: model.type
    }));
  },

  async generateModel(modelId: string, params: any = {}) {
    const model = processedModels.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    if (model.type === 'parametric') {
      // TypeScript now knows this is a ParametricModel
      const parametricModel = model as ParametricModel;
      const finalParams = { ...parametricModel.defaultParams, ...params };
      return parametricModel.config.generateModel(finalParams);
    } else {
      // TypeScript now knows this is a StaticModel
      const staticModel = model as StaticModel;
      return staticModel.createFunction();
    }
  },

  getModelConfig(modelId: string) {
    const model = processedModels.find(m => m.id === modelId);
    if (!model || model.type !== 'parametric') {
      return null;
    }
    return (model as ParametricModel).config;
  },

  getPipelineInfo() {
    return {
      version: manifestData.version,
      modelCount: processedModels.length,
      generatedAt: manifestData.generatedAt,
      models: this.getAvailableModels()
    };
  }
};

// Generate manifest data using pipeline functions as source of truth
export const manifestData = {
  version: Date.now().toString(),
  generatedAt: new Date().toISOString(),
  models: pipeline.getAvailableModels().map(model => {
    const baseModel = model;

    if (model.type === 'parametric') {
      const config = pipeline.getModelConfig(model.id);
      return {
        ...baseModel,
        config: {
          parameters: config?.parameters || {},
          description: config?.description || `Parametric model: ${model.name}`
        }
      };
    } else {
      // Static model - use metadata description if available
      const staticModel = processedModels.find(m => m.id === model.id) as StaticModel;
      const description = staticModel?.metadata?.description || `Static model: ${model.name}`;
      return {
        ...baseModel,
        description: description
      };
    }
  })
};

// Export as default for compatibility
export default pipeline;
