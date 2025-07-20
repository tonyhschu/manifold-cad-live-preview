/**
 * Pipeline Loader
 * 
 * Handles loading and reloading of pipeline functions for V3 architecture.
 * Implements simple pipeline replacement instead of complex HMR.
 */

import type { PipelineLoader, ModelPipeline } from '../types/pipeline.js';

/**
 * Pipeline loader implementation
 * 
 * This replaces the complex V1 HMR system with simple pipeline reloading.
 * When the pipeline.js file changes, we just reload the entire pipeline.
 */
export class PipelineLoaderImpl implements PipelineLoader {
  private currentPipeline: ModelPipeline | null = null;

  constructor(private pipelinePath: string = './temp/pipeline.js') {}

  /**
   * Get the current pipeline instance
   */
  getPipeline(): ModelPipeline | null {
    return this.currentPipeline;
  }

  /**
   * Load the pipeline module
   */
  private async loadPipeline(): Promise<void> {
    try {
      // Dynamic import with cache busting for HMR
      const cacheBuster = `?t=${Date.now()}`;
      const module = await import(
         /* @vite-ignore */
        this.pipelinePath + cacheBuster
      );
      const pipeline = module.default || module.pipeline;

      if (!pipeline) {
        throw new Error('Pipeline module does not export a pipeline object');
      }

      // Validate pipeline interface
      if (typeof pipeline.getAvailableModels !== 'function' ||
          typeof pipeline.generateModel !== 'function' ||
          typeof pipeline.getModelConfig !== 'function') {
        throw new Error('Pipeline does not implement required ModelPipeline interface');
      }

      // Attach manifestData if available
      if (module.manifestData) {
        (pipeline as any).manifestData = module.manifestData;
      }

      this.currentPipeline = pipeline;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Initialize pipeline loader
   * Just loads the pipeline once, no polling
   */
  async initialize(): Promise<boolean> {
    try {
      await this.loadPipeline();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Force reload the pipeline module
   */
  async reloadPipeline(): Promise<void> {
    await this.loadPipeline();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.currentPipeline = null;
  }
}

/**
 * Factory function to create pipeline loader
 */
export function createPipelineLoader(pipelinePath?: string): PipelineLoader {
  return new PipelineLoaderImpl(pipelinePath);
}
