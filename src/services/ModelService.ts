/**
 * ModelService - Model Loading and Management
 * 
 * Handles model loading, caching, and export generation.
 * Orchestrates the complete model workflow using other services.
 */

import { IModelService, IExportService, ModelLoadResult, ProgressCallback } from './interfaces';
import { getAvailableModels, loadModelById, ModelMetadata } from '../core/model-loader';

/**
 * Model cache entry
 */
interface CacheEntry {
  model: any;
  metadata?: ModelMetadata;
  loadedAt: number;
  exports?: {
    objUrl: string;
    glbUrl: string;
  };
}

/**
 * Model service implementation
 */
export class ModelService implements IModelService {
  private cache = new Map<string, CacheEntry>();
  private cacheMaxAge = 5 * 60 * 1000; // 5 minutes
  
  constructor(private exportService: IExportService) {}
  
  /**
   * Load a model by ID with full export generation
   */
  async loadModel(modelId: string, onProgress?: ProgressCallback): Promise<ModelLoadResult> {
    onProgress?.(0, `Loading model: ${modelId}...`);
    
    try {
      // Check cache first
      const cached = this.getCachedModel(modelId);
      if (cached) {
        onProgress?.(100, 'Model loaded from cache');
        return {
          model: cached.model,
          metadata: cached.metadata,
          exports: cached.exports!
        };
      }
      
      onProgress?.(10, 'Loading model from source...');
      
      // Load the model using the existing model loader
      const { model, metadata } = await loadModelById(modelId);
      
      onProgress?.(30, 'Model loaded, generating exports...');
      
      // Generate OBJ export
      onProgress?.(40, 'Exporting to OBJ format...');
      const objResult = await this.exportService.exportToOBJ(model, `${modelId}.obj`);
      
      // Generate GLB export
      onProgress?.(60, 'Exporting to GLB format...');
      const glbResult = await this.exportService.exportToGLB(model, `${modelId}.glb`, (progress, message) => {
        // Scale GLB progress to 60-90 range
        const scaledProgress = 60 + (progress * 0.3);
        onProgress?.(scaledProgress, message || 'Generating GLB...');
      });
      
      onProgress?.(90, 'Caching model...');
      
      // Create cache entry
      const exports = {
        objUrl: objResult.url,
        glbUrl: glbResult.url
      };
      
      const cacheEntry: CacheEntry = {
        model,
        metadata,
        loadedAt: Date.now(),
        exports
      };
      
      // Cache the loaded model
      this.cache.set(modelId, cacheEntry);
      
      onProgress?.(100, 'Model loaded successfully');
      
      return {
        model,
        metadata,
        exports
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown loading error';
      throw new Error(`Failed to load model "${modelId}": ${errorMessage}`);
    }
  }
  
  /**
   * Get available models list
   */
  getAvailableModels(): { id: string; name: string }[] {
    return getAvailableModels();
  }
  
  /**
   * Refresh available models cache
   */
  refreshAvailableModels(): void {
    // The model loader doesn't have a refresh method, but we could add one
    // For now, this is a no-op since getAvailableModels() reads fresh data
  }
  
  /**
   * Get cached model if available and not expired
   */
  getCachedModel(modelId: string): CacheEntry | null {
    const entry = this.cache.get(modelId);
    if (!entry) {
      return null;
    }
    
    // Check if cache entry is expired
    const now = Date.now();
    if (now - entry.loadedAt > this.cacheMaxAge) {
      this.cache.delete(modelId);
      return null;
    }
    
    return entry;
  }
  
  /**
   * Clear model cache
   */
  clearCache(): void {
    // Clean up any URLs from cached exports
    for (const entry of this.cache.values()) {
      if (entry.exports) {
        // Note: UrlService cleanup will handle this, but we could be more explicit
      }
    }
    
    this.cache.clear();
  }
  
  /**
   * Pre-load a model without returning it (for performance)
   */
  async preloadModel(modelId: string): Promise<void> {
    if (!this.getCachedModel(modelId)) {
      await this.loadModel(modelId);
    }
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    entries: Array<{ id: string; loadedAt: number; hasExports: boolean }>;
  } {
    const entries: Array<{ id: string; loadedAt: number; hasExports: boolean }> = [];
    
    for (const [id, entry] of this.cache.entries()) {
      entries.push({
        id,
        loadedAt: entry.loadedAt,
        hasExports: !!entry.exports
      });
    }
    
    return {
      size: this.cache.size,
      entries
    };
  }
  
  /**
   * Check if model is cached
   */
  isModelCached(modelId: string): boolean {
    return this.getCachedModel(modelId) !== null;
  }
  
  /**
   * Set cache max age
   */
  setCacheMaxAge(maxAge: number): void {
    this.cacheMaxAge = maxAge;
  }
  
  /**
   * Clean up expired cache entries
   */
  cleanupExpiredCache(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    for (const [id, entry] of this.cache.entries()) {
      if (now - entry.loadedAt > this.cacheMaxAge) {
        toDelete.push(id);
      }
    }
    
    for (const id of toDelete) {
      this.cache.delete(id);
    }
  }
}

/**
 * Factory function to create model service
 */
export function createModelService(exportService: IExportService): IModelService {
  return new ModelService(exportService);
}