/**
 * Service Type Definitions
 * 
 * Interfaces for V3 service layer.
 * Simplified from V1/V2 service interfaces for pipeline-based architecture.
 */

import type { ModelLoadResult, ModelConfig } from './model.js';
import type { ModelPipeline } from './pipeline.js';

/**
 * Progress callback for long-running operations
 */
export type ProgressCallback = (progress: number, message: string) => void;

/**
 * Model service interface for V3
 * Simplified to work with pipeline-based architecture
 */
export interface IModelService {
  /**
   * Load a model using the current pipeline
   * @param modelId - ID of the model to load
   * @param params - Parameters for parametric models
   * @param onProgress - Optional progress callback
   * @returns Promise that resolves to model load result
   */
  loadModel(modelId: string, params?: any, onProgress?: ProgressCallback): Promise<ModelLoadResult>;

  /**
   * Get available models from the current pipeline
   * @returns Array of available model configurations
   */
  getAvailableModels(): ModelConfig[];

  /**
   * Check if a model is parametric
   * @param modelId - ID of the model to check
   * @returns True if the model is parametric
   */
  isParametric(modelId: string): boolean;

  /**
   * Get parameter configuration for a parametric model
   * @param modelId - ID of the model
   * @returns Parameter configuration or null
   */
  getParameterConfig(modelId: string): any;

  /**
   * Set the pipeline to use for model operations
   * @param pipeline - Pipeline instance
   */
  setPipeline(pipeline: ModelPipeline): void;
}

/**
 * Export service interface (unchanged from V1/V2)
 * Handles conversion of Manifold objects to various formats
 */
export interface IExportService {
  /**
   * Export a Manifold object to GLB format
   * @param manifold - Manifold object to export
   * @param onProgress - Optional progress callback
   * @returns Promise that resolves to GLB blob URL
   */
  exportToGLB(manifold: any, onProgress?: ProgressCallback): Promise<string>;

  /**
   * Export a Manifold object to OBJ format
   * @param manifold - Manifold object to export
   * @param onProgress - Optional progress callback
   * @returns Promise that resolves to OBJ blob URL
   */
  exportToOBJ(manifold: any, onProgress?: ProgressCallback): Promise<string>;

  /**
   * Export a Manifold object to both GLB and OBJ formats
   * @param manifold - Manifold object to export
   * @param onProgress - Optional progress callback
   * @returns Promise that resolves to both blob URLs
   */
  exportToBoth(manifold: any, onProgress?: ProgressCallback): Promise<{
    objUrl: string;
    glbUrl: string;
  }>;
}

/**
 * URL service interface (unchanged from V1/V2)
 * Manages blob URLs and cleanup
 */
export interface IUrlService {
  /**
   * Create a blob URL and track it for cleanup
   * @param blob - Blob to create URL for
   * @param category - Category for organization
   * @returns Blob URL
   */
  createBlobUrl(blob: Blob, category?: string): string;

  /**
   * Revoke a specific blob URL
   * @param url - URL to revoke
   */
  revokeBlobUrl(url: string): void;

  /**
   * Revoke all blob URLs in a category
   * @param category - Category to clean up
   */
  revokeCategory(category: string): void;

  /**
   * Revoke all tracked blob URLs
   */
  revokeAll(): void;

  /**
   * Get statistics about tracked URLs
   */
  getStats(): {
    totalUrls: number;
    categories: Record<string, number>;
  };
}
