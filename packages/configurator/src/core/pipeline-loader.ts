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
  private lastModified: string | null = null;
  private checkInterval: number | null = null;
  private isChecking = false;

  constructor(private pipelinePath: string = './temp/pipeline.js') {}

  /**
   * Check if pipeline has been updated
   * Uses HTTP HEAD request to check last-modified header
   */
  async checkForUpdates(): Promise<boolean> {
    if (this.isChecking) {
      return false; // Prevent concurrent checks
    }

    this.isChecking = true;

    try {
      console.log('🔍 Checking for pipeline updates...');
      
      // Use HEAD request to check if file has been modified
      const response = await fetch(this.pipelinePath, { 
        method: "HEAD",
        cache: "no-cache" // Ensure we get fresh headers
      });

      if (!response.ok) {
        console.log('⚠️ Pipeline not available yet');
        return false;
      }

      const modified = response.headers.get("last-modified");
      console.log(`📅 Pipeline last modified: ${modified}`);
      console.log(`📅 Previous last modified: ${this.lastModified}`);

      if (modified !== this.lastModified) {
        console.log('🔄 Pipeline has been updated, reloading...');
        await this.reloadPipeline();
        this.lastModified = modified;
        return true;
      }

      console.log('✅ Pipeline is up to date');
      return false;

    } catch (error) {
      console.log("⚠️ Pipeline check failed:", error);
      return false;
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Get the current pipeline instance
   */
  getPipeline(): ModelPipeline | null {
    return this.currentPipeline;
  }

  /**
   * Force reload the pipeline
   */
  async reloadPipeline(): Promise<void> {
    try {
      console.log('🔄 Reloading pipeline...');
      
      // Add timestamp to bust module cache
      const timestamp = Date.now();
      const moduleUrl = `${this.pipelinePath}?t=${timestamp}`;
      
      console.log(`📦 Loading pipeline from: ${moduleUrl}`);
      
      // Dynamic import with cache busting
      const module = await import(moduleUrl);
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
      console.log('✅ Pipeline reloaded successfully');
      
      // Log pipeline info
      const info = pipeline.getPipelineInfo?.();
      if (info) {
        console.log(`📊 Pipeline info: ${info.modelCount} models, version ${info.version}`);
      }

    } catch (error) {
      console.error('❌ Failed to reload pipeline:', error);
      throw error;
    }
  }

  /**
   * Start automatic checking for pipeline updates
   * 
   * @param intervalMs - Check interval in milliseconds (default: 1000ms)
   * @param onChange - Callback when pipeline is reloaded
   */
  startAutoCheck(intervalMs: number = 1000, onChange?: () => void): void {
    if (this.checkInterval !== null) {
      console.log('👀 Auto-check already running');
      return;
    }

    console.log(`👀 Starting auto-check every ${intervalMs}ms`);
    
    this.checkInterval = window.setInterval(async () => {
      try {
        const wasUpdated = await this.checkForUpdates();
        if (wasUpdated && onChange) {
          onChange();
        }
      } catch (error) {
        console.error('Auto-check error:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop automatic checking
   */
  stopAutoCheck(): void {
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🛑 Auto-check stopped');
    }
  }

  /**
   * Initialize pipeline loader
   * Attempts to load pipeline immediately and optionally starts auto-checking
   */
  async initialize(autoCheck: boolean = true): Promise<boolean> {
    console.log('🚀 Initializing pipeline loader...');
    
    try {
      // Try to load pipeline immediately
      await this.reloadPipeline();
      
      if (autoCheck) {
        this.startAutoCheck();
      }
      
      console.log('✅ Pipeline loader initialized');
      return true;
      
    } catch (error) {
      console.log('⚠️ Initial pipeline load failed, will retry:', error);
      
      if (autoCheck) {
        // Start auto-check even if initial load failed
        // This allows the pipeline to be loaded when it becomes available
        this.startAutoCheck();
      }
      
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAutoCheck();
    this.currentPipeline = null;
    this.lastModified = null;
    console.log('🧹 Pipeline loader destroyed');
  }
}

/**
 * Factory function to create pipeline loader
 */
export function createPipelineLoader(pipelinePath?: string): PipelineLoader {
  return new PipelineLoaderImpl(pipelinePath);
}
