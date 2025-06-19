/**
 * Pipeline Entry Point
 * 
 * This file is built by Vite to create the pipeline.js output.
 * It discovers and compiles all models into a single pipeline object.
 */

// Import model files directly - Vite will handle the bundling
import mainModel from './main.ts';
import simpleCube from './components/simple-cube.ts';
import wheelModel from './components/wheel.ts';

// Utility functions (copied locally to avoid import issues)
function isParametricConfig(obj: any): boolean {
  return (
    obj &&
    typeof obj === 'object' &&
    'parameters' in obj &&
    'generateModel' in obj &&
    typeof obj.generateModel === 'function'
  );
}

function extractDefaultParams(config: any): Record<string, any> {
  const defaultParams: Record<string, any> = {};

  for (const [key, paramConfig] of Object.entries(config.parameters)) {
    defaultParams[key] = (paramConfig as any).value;
  }

  return defaultParams;
}

// Define the models that were discovered
const modelDefinitions = [
  { id: 'main', path: './main.ts', module: mainModel },
  { id: 'components/simple-cube', path: './components/simple-cube.ts', module: simpleCube },
  { id: 'components/wheel', path: './components/wheel.ts', module: wheelModel }
];

// Process each model and create the pipeline
const processedModels = modelDefinitions.map(({ id, path, module }) => {
  const defaultExport = module;
  
  if (isParametricConfig(defaultExport)) {
    // Parametric model
    return {
      id,
      name: defaultExport.name || id,
      type: 'parametric' as const,
      config: defaultExport,
      defaultParams: extractDefaultParams(defaultExport)
    };
  } else if (typeof defaultExport === 'function') {
    // Static model
    return {
      id,
      name: id, // Could extract from metadata if available
      type: 'static' as const,
      createFunction: defaultExport
    };
  } else {
    throw new Error(`Invalid model export in ${path}`);
  }
});

// Generate manifest data for external consumption
export const manifestData = {
  version: Date.now().toString(),
  generatedAt: new Date().toISOString(),
  models: processedModels.map(model => {
    const baseModel = {
      id: model.id,
      name: model.name,
      type: model.type
    };

    if (model.type === 'parametric') {
      return {
        ...baseModel,
        config: {
          parameters: model.config.parameters,
          description: model.config.description || `Parametric model: ${model.name}`
        }
      };
    } else {
      return {
        ...baseModel,
        description: `Static model: ${model.name}`
      };
    }
  })
};

// Create the pipeline object
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
      // Merge provided params with defaults
      const finalParams = { ...model.defaultParams, ...params };
      return model.config.generateModel(finalParams);
    } else {
      // Static model
      return model.createFunction();
    }
  },

  getModelConfig(modelId: string) {
    const model = processedModels.find(m => m.id === modelId);
    if (!model || model.type !== 'parametric') {
      return null;
    }
    return model.config;
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

// Export as default for compatibility
export default pipeline;
