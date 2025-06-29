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
      console.log('� Loading pipeline...');

      // Dynamic import
      const module = await import(this.pipelinePath);
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

      this.currentPipeline = pipeline;
      console.log('✅ Pipeline loaded successfully');

      // Log pipeline info
      const info = pipeline.getPipelineInfo?.();
      if (info) {
        console.log(`📊 Pipeline info: ${info.modelCount} models, version ${info.version}`);
      }

    } catch (error) {
      console.error('❌ Failed to load pipeline:', error);
      throw error;
    }
  }

  /**
   * Initialize pipeline loader
   * Just loads the pipeline once, no polling
   */
  async initialize(): Promise<boolean> {
    console.log('🚀 Initializing pipeline loader...');

    try {
      // Try to load pipeline immediately
      await this.loadPipeline();
      console.log('✅ Pipeline loader initialized');
      return true;

    } catch (error) {
      console.log('⚠️ Initial pipeline load failed:', error);
      return false;
    }
  }

  /**
   * Force reload the pipeline module
   */
  async reloadPipeline(): Promise<void> {
    console.log('🔄 Force reloading pipeline module...');
    await this.loadPipeline();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.currentPipeline = null;
    console.log('🧹 Pipeline loader destroyed');
  }
}

/**
 * Factory function to create pipeline loader
 */
export function createPipelineLoader(pipelinePath?: string): PipelineLoader {
  return new PipelineLoaderImpl(pipelinePath);
}
