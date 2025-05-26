/**
 * Service Interfaces for Adapter Layer
 * 
 * These interfaces define the contracts between UI components and the library,
 * enabling clean separation and future library extraction.
 */

import { ModelMetadata } from '../core/model-loader';
import type { ParametricConfig } from '../types/parametric-config';

// ===== CORE TYPES =====

/**
 * Progress callback for long-running operations
 */
export type ProgressCallback = (progress: number, message?: string) => void;

/**
 * Export format definition for multiple format support
 */
export interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  description: string;
}

/**
 * Export result containing blob and metadata
 */
export interface ExportResult {
  blob: Blob;
  url: string;
  filename: string;
  format: ExportFormat;
}

/**
 * Model loading result
 */
export interface ModelLoadResult {
  model: any; // Manifold object
  metadata?: ModelMetadata;
  isParametric?: boolean;
  config?: ParametricConfig;
  exports: {
    objUrl: string;
    glbUrl: string;
  };
}

// ===== SERVICE INTERFACES =====

/**
 * ModelService - Handles model loading and caching
 * Pure adapter for model operations without UI concerns
 */
export interface IModelService {
  /**
   * Load a model by ID with progress tracking
   */
  loadModel(modelId: string, onProgress?: ProgressCallback): Promise<ModelLoadResult>;
  
  /**
   * Get available models list
   */
  getAvailableModels(): { id: string; name: string; type: 'static' | 'parametric' }[];
  
  /**
   * Refresh the available models cache
   */
  refreshAvailableModels(): void;
  
  /**
   * Get cached model if available
   */
  getCachedModel(modelId: string): any | null;
  
  /**
   * Clear model cache
   */
  clearCache(): void;
}

/**
 * ExportService - Handles export operations for multiple formats
 * Bridges between library export functions and UI needs
 */
export interface IExportService {
  /**
   * Get supported export formats
   */
  getSupportedFormats(): ExportFormat[];
  
  /**
   * Export model to specified format
   */
  exportModel(
    model: any, 
    formatId: string, 
    filename?: string,
    onProgress?: ProgressCallback
  ): Promise<ExportResult>;
  
  /**
   * Export model to OBJ format (convenience method)
   */
  exportToOBJ(model: any, filename?: string): Promise<ExportResult>;
  
  /**
   * Export model to GLB format (convenience method)
   */
  exportToGLB(model: any, filename?: string, onProgress?: ProgressCallback): Promise<ExportResult>;
  
  /**
   * Cleanup export resources (URLs, etc.)
   */
  cleanup(): void;
}

/**
 * UrlService - Handles browser-specific URL/blob management
 * Encapsulates browser APIs for clean testing and abstraction
 */
export interface IUrlService {
  /**
   * Create object URL from blob
   */
  createObjectURL(blob: Blob): string;
  
  /**
   * Revoke object URL
   */
  revokeObjectURL(url: string): void;
  
  /**
   * Generate filename with timestamp
   */
  generateFilename(baseName: string, extension: string): string;
  
  /**
   * Cleanup all managed URLs
   */
  cleanup(): void;
  
  /**
   * Get managed URL count (for debugging)
   */
  getManagedUrlCount(): number;
}

// ===== EVENTS =====

/**
 * Service events for loose coupling between services and UI
 */
export interface ServiceEvents {
  'model:loading': { modelId: string };
  'model:loaded': { modelId: string; model: any; metadata?: ModelMetadata };
  'model:error': { modelId: string; error: Error };
  
  'export:started': { format: string; filename: string };
  'export:progress': { progress: number; message?: string };
  'export:completed': { result: ExportResult };
  'export:error': { error: Error };
}

/**
 * Event emitter interface for services
 */
export interface IEventEmitter {
  on<K extends keyof ServiceEvents>(event: K, listener: (data: ServiceEvents[K]) => void): void;
  off<K extends keyof ServiceEvents>(event: K, listener: (data: ServiceEvents[K]) => void): void;
  emit<K extends keyof ServiceEvents>(event: K, data: ServiceEvents[K]): void;
}