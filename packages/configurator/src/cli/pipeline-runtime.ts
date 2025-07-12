/**
 * Pipeline Runtime - Reusable pipeline logic
 * 
 * This contains all the non-dynamic pipeline logic that can be shared
 * across generated pipelines, avoiding code duplication.
 */

// Type definitions
export interface ParametricConfig {
  name: string;
  description?: string;
  parameters: Record<string, { value: any; min?: any; max?: any; }>;
  generateModel: (params: any) => any;
}

export interface ParametricModel {
  id: string;
  name: string;
  type: 'parametric';
  config: ParametricConfig;
  defaultParams: Record<string, any>;
}

export interface StaticModel {
  id: string;
  name: string;
  type: 'static';
  createFunction: () => any;
  metadata?: any;
}

export type ProcessedModel = ParametricModel | StaticModel;

export interface ModelDefinition {
  id: string;
  module: any;
}

// Helper functions
export function isParametricConfig(obj: any): obj is ParametricConfig {
  return (
    obj &&
    typeof obj === 'object' &&
    'parameters' in obj &&
    'generateModel' in obj &&
    typeof obj.generateModel === 'function'
  );
}

export function extractDefaultParams(config: ParametricConfig): Record<string, any> {
  const defaultParams: Record<string, any> = {};

  for (const [key, paramConfig] of Object.entries(config.parameters)) {
    defaultParams[key] = paramConfig.value;
  }

  return defaultParams;
}

// Model processing logic
export function processModels(modelDefinitions: ModelDefinition[]): ProcessedModel[] {
  return modelDefinitions.map(({ id, module }) => {
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
      throw new Error(`Invalid model export in ${id}`);
    }
  });
}

// Pipeline factory - creates a pipeline from processed models
export function createPipeline(processedModels: ProcessedModel[]) {
  return {
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
    }
  };
}

// Manifest generation
export function generateManifest(modelDefinitions: ModelDefinition[]) {
  return {
    version: Date.now().toString(),
    generatedAt: new Date().toISOString(),
    models: modelDefinitions.map(model => {
      return {
        id: model.id,
        name: model.id.replace(/^components\//, '').replace(/[-_]/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        type: 'static', // Default to static for now
        description: `Model: ${model.id}`
      };
    })
  };
}
