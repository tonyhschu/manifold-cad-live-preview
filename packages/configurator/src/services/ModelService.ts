/**
 * ModelService - Model Loading and Management
 *
 * Handles model loading, caching, and export generation.
 * Orchestrates the complete model workflow using other services.
 */

import { IModelService, IExportService, ModelLoadResult, ProgressCallback } from './interfaces';
import { ModelMetadata } from '../core/model-loader';
import type { ParametricConfig } from '@manifold-studio/wrapper';

/**
 * Model cache entry
 */
interface CacheEntry {
  model: any;
  metadata?: ModelMetadata;
  isParametric?: boolean;
  config?: ParametricConfig;
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
   * Try to load model from temp folder GLB files
   */
  private async tryLoadFromTempFolder(modelId: string, onProgress?: ProgressCallback): Promise<ModelLoadResult | null> {
    try {
      onProgress?.(5, 'Checking temp folder for compiled model...');

      // Try to fetch the manifest to get model info
      const manifestResponse = await fetch('./temp/manifest.json');
      if (!manifestResponse.ok) {
        console.log('📂 No temp/manifest.json found, skipping temp folder loading');
        return null;
      }

      const manifest = await manifestResponse.json();
      const modelInfo = manifest.models.find((m: any) => m.id === modelId && m.status === 'compiled');

      if (!modelInfo || !modelInfo.blobPath) {
        console.log(`📂 Model "${modelId}" not found in temp folder or not compiled`);
        return null;
      }

      onProgress?.(15, 'Loading compiled GLB from temp folder...');

      // Try to fetch the GLB file
      const glbPath = `./temp/${modelInfo.blobPath}`;
      const glbResponse = await fetch(glbPath);

      if (!glbResponse.ok) {
        console.log(`📂 GLB file not found at ${glbPath}`);
        return null;
      }

      onProgress?.(50, 'Creating blob URLs...');

      // Create blob URL for the GLB
      const glbBlob = await glbResponse.blob();
      const glbUrl = URL.createObjectURL(glbBlob);

      // For temp folder models, we don't have the original Manifold object
      // So we create a minimal result with just the GLB
      const result: ModelLoadResult = {
        model: null, // No Manifold object available from GLB
        metadata: {
          name: modelInfo.name,
          description: `Compiled model from temp folder (${modelInfo.type})`
        },
        isParametric: modelInfo.type === 'parametric',
        config: null, // No config available from GLB
        exports: {
          objUrl: '', // No OBJ available from temp folder
          glbUrl: glbUrl
        }
      };

      console.log(`✅ ModelService: Loaded "${modelId}" from temp folder GLB (${modelInfo.blobSize} bytes)`);
      onProgress?.(100, 'Model loaded from temp folder');

      return result;

    } catch (error) {
      console.log(`📂 Error loading from temp folder:`, error);
      return null;
    }
  }

  /**
   * Load a model by ID with full export generation
   */
  async loadModel(modelId: string, onProgress?: ProgressCallback): Promise<ModelLoadResult> {
    onProgress?.(0, `Loading model: ${modelId}...`);

    try {
      // Skip cache during development for HMR
      const skipCache = import.meta.env.DEV && (globalThis as any).__MODEL_REBUILD_TIMESTAMP__;

      if (!skipCache) {
        // Check cache first (production mode)
        const cached = this.getCachedModel(modelId);
        if (cached) {
          console.log(`🎯 ModelService: Loading "${modelId}" from cache (cache hit)`);
          onProgress?.(100, 'Model loaded from cache');
          return {
            model: cached.model,
            metadata: cached.metadata,
            isParametric: cached.isParametric,
            config: cached.config,
            exports: cached.exports!
          };
        }
      } else {
        console.log(`🎯 ModelService: Skipping cache for "${modelId}" (HMR mode)`);
      }

      // Load from temp folder (primary path)
      const tempResult = await this.tryLoadFromTempFolder(modelId, onProgress);
      if (tempResult) {
        return tempResult;
      }

      // No compiled model found - show helpful error
      throw new Error(`Model "${modelId}" not found. Run "npm run dev:models" to compile your models.`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown loading error';
      throw new Error(`Failed to load model "${modelId}": ${errorMessage}`);
    }
  }

  /**
   * Get available models list (deprecated - use V3 system via v3-bridge instead)
   */
  getAvailableModels(): { id: string; name: string; type: 'static' | 'parametric' }[] {
    console.warn('ModelService.getAvailableModels() is deprecated. Use V3 system via v3-bridge instead.');
    return [];
  }

  /**
   * Refresh available models cache (deprecated - use V3 system via v3-bridge instead)
   */
  refreshAvailableModels(): void {
    console.warn('ModelService.refreshAvailableModels() is deprecated. Use V3 system via v3-bridge instead.');
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
    const cacheSize = this.cache.size;
    const cachedModels = Array.from(this.cache.keys());

    console.log(`🗑️ ModelService: Clearing cache (${cacheSize} entries):`, cachedModels);

    // Clean up any URLs from cached exports
    for (const entry of this.cache.values()) {
      if (entry.exports) {
        // Note: UrlService cleanup will handle this, but we could be more explicit
      }
    }

    this.cache.clear();
    console.log(`✅ ModelService: Cache cleared (now ${this.cache.size} entries)`);
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