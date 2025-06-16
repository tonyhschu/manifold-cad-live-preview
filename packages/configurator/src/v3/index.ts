/**
 * V3 Architecture - Public API
 * 
 * Exports for the complete V3 pipeline-based architecture.
 */

// Core pipeline loading
export {
  PipelineLoaderImpl,
  createPipelineLoader
} from '../core/pipeline-loader.js';

// State management
export {
  UIStateManager,
  type UIState
} from '../state/ui-state.js';

// Services
export {
  V3ModelService,
  createV3ModelService
} from '../services/V3ModelService.js';

// Components
export {
  V3Configurator,
  createV3Configurator
} from '../components/V3Configurator.js';

// Types (re-export from main types)
export type {
  ModelPipeline,
  PipelineLoader,
  PipelineCompilationResult,
  PipelineCompiler,
  PipelineManifest
} from '../types/pipeline.js';

export type {
  IModelService,
  ModelLoadResult,
  ModelConfig,
  ProgressCallback
} from '../types/service.js';
