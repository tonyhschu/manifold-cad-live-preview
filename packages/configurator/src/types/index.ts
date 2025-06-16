/**
 * Type Definitions Index
 * 
 * Central export point for all V3 type definitions.
 * Provides clean imports for other modules.
 */

// Model types
export type {
  ModelMetadata,
  ModelRegistryEntry,
  ModelCreator,
  ParametricModel,
  ModelLoadResult,
  ModelDiscoveryConfig,
  ModelConfig
} from './model.js';

// Pipeline types
export type {
  ModelPipeline,
  PipelineLoader,
  PipelineCompilationResult,
  PipelineCompiler,
  PipelineManifest
} from './pipeline.js';

// Service types
export type {
  ProgressCallback,
  IModelService,
  IExportService,
  IUrlService
} from './service.js';
