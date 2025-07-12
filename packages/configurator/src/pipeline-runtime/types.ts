// Shared type definitions and utilities for pipeline runtime
// These are used both in the configurator and in generated pipeline files

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

// Helper functions that can be shared
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

export function processModels(modelDefinitions: Array<{ id: string; module: any }>): ProcessedModel[] {
  return modelDefinitions.map(({ id, module }) => {
    const defaultExport = (module as any).default || module;

    if (isParametricConfig(defaultExport)) {
      return {
        id,
        name: defaultExport.name || id,
        type: 'parametric' as const,
        config: defaultExport,
        defaultParams: extractDefaultParams(defaultExport)
      } as ParametricModel;
    } else if (typeof defaultExport === 'function') {
      const metadata = module.modelMetadata || {};
      return {
        id,
        name: metadata.name || id,
        type: 'static' as const,
        createFunction: defaultExport,
        metadata: metadata
      } as StaticModel;
    } else {
      throw new Error(`Invalid model export in ${id}. Expected a function or ParametricConfig object.`);
    }
  });
}
