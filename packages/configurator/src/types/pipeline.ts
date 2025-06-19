/**
 * Pipeline Type Definitions
 * 
 * New interfaces for V3 pipeline-based architecture.
 * These define the contract between pipeline compiler and UI harness.
 */

import type { ParametricConfig } from '@manifold-studio/wrapper';
import type { ModelConfig } from './model.js';

/**
 * Main pipeline interface
 * This is the contract that compiled pipeline functions must implement
 */
export interface ModelPipeline {
  /**
   * Get list of all available models in the pipeline
   * @returns Array of model configurations
   */
  getAvailableModels(): ModelConfig[];

  /**
   * Generate a model with the given parameters
   * @param modelId - ID of the model to generate
   * @param params - Parameters to pass to the model (for parametric models)
   * @returns Manifold object
   */
  generateModel(modelId: string, params?: any): any;

  /**
   * Get parameter configuration for a parametric model
   * @param modelId - ID of the model
   * @returns Parameter configuration or null for static models
   */
  getModelConfig(modelId: string): ParametricConfig | null;
}

/**
 * Pipeline loader interface
 * Handles loading of pipeline functions
 */
export interface PipelineLoader {
  /**
   * Get the current pipeline instance
   * @returns Current pipeline or null if not loaded
   */
  getPipeline(): ModelPipeline | null;
}

/**
 * Pipeline compilation result
 * Information about a compiled pipeline
 */
export interface PipelineCompilationResult {
  /** Path to the compiled pipeline file */
  pipelinePath: string;
  /** Compilation timestamp */
  compiledAt: string;
  /** Number of models compiled */
  modelCount: number;
  /** Compilation errors, if any */
  errors?: string[];
  /** Compilation warnings, if any */
  warnings?: string[];
}

/**
 * Pipeline compiler interface
 * Handles compilation of source files to pipeline functions
 */
export interface PipelineCompiler {
  /**
   * Compile all discovered models into a pipeline
   * @returns Promise that resolves to compilation result
   */
  compile(): Promise<PipelineCompilationResult>;

  /**
   * Start watching for file changes and auto-compile
   * @param onChange - Callback when compilation completes
   */
  startWatching(onChange?: (result: PipelineCompilationResult) => void): void;

  /**
   * Stop watching for file changes
   */
  stopWatching(): void;
}

/**
 * Pipeline manifest
 * Metadata about the compiled pipeline
 */
export interface PipelineManifest {
  /** Available models in the pipeline */
  models: ModelConfig[];
  /** When the pipeline was last compiled */
  lastCompiled: string;
  /** Pipeline version/build number */
  version: number;
  /** Compilation metadata */
  compilation: {
    duration: number;
    errors: string[];
    warnings: string[];
  };
}
