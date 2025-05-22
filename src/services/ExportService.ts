/**
 * ExportService - Multi-Format Export Operations
 * 
 * Handles exporting Manifold models to various formats with progress tracking
 * and URL generation. Bridges between library export functions and UI needs.
 */

import { IExportService, IUrlService, ExportFormat, ExportResult, ProgressCallback } from './interfaces';
import { exportToOBJ } from '../lib/export';
import { manifoldToGLB } from '../lib/gltf-export';

/**
 * Export format definitions
 */
const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'obj',
    name: 'Wavefront OBJ',
    extension: 'obj',
    mimeType: 'model/obj',
    description: 'OBJ format with vertex and face data'
  },
  {
    id: 'glb',
    name: 'glTF Binary',
    extension: 'glb',
    mimeType: 'model/gltf-binary',
    description: 'Binary glTF format for 3D scenes'
  }
  // Future formats can be added here:
  // {
  //   id: '3mf',
  //   name: '3D Manufacturing Format',
  //   extension: '3mf',
  //   mimeType: 'model/3mf',
  //   description: '3MF format for 3D printing'
  // }
];

/**
 * Export service implementation
 */
export class ExportService implements IExportService {
  constructor(private urlService: IUrlService) {}
  
  /**
   * Get all supported export formats
   */
  getSupportedFormats(): ExportFormat[] {
    return [...EXPORT_FORMATS];
  }
  
  /**
   * Export model to specified format
   */
  async exportModel(
    model: any,
    formatId: string,
    filename?: string,
    onProgress?: ProgressCallback
  ): Promise<ExportResult> {
    const format = EXPORT_FORMATS.find(f => f.id === formatId);
    if (!format) {
      throw new Error(`Unsupported export format: ${formatId}`);
    }
    
    onProgress?.(0, `Starting ${format.name} export...`);
    
    try {
      let blob: Blob;
      
      switch (formatId) {
        case 'obj':
          blob = await this.exportToOBJInternal(model, onProgress);
          break;
        case 'glb':
          blob = await this.exportToGLBInternal(model, onProgress);
          break;
        default:
          throw new Error(`Export function not implemented for format: ${formatId}`);
      }
      
      onProgress?.(90, 'Creating download URL...');
      
      const url = this.urlService.createObjectURL(blob);
      const finalFilename = filename || this.urlService.generateFilename(
        `manifold-model`,
        format.extension
      );
      
      onProgress?.(100, 'Export complete');
      
      return {
        blob,
        url,
        filename: finalFilename,
        format
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown export error';
      throw new Error(`Export failed: ${errorMessage}`);
    }
  }
  
  /**
   * Export to OBJ format (convenience method)
   */
  async exportToOBJ(model: any, filename?: string): Promise<ExportResult> {
    return this.exportModel(model, 'obj', filename);
  }
  
  /**
   * Export to GLB format (convenience method)
   */
  async exportToGLB(model: any, filename?: string, onProgress?: ProgressCallback): Promise<ExportResult> {
    return this.exportModel(model, 'glb', filename, onProgress);
  }
  
  /**
   * Cleanup export resources
   */
  cleanup(): void {
    this.urlService.cleanup();
  }
  
  /**
   * Internal OBJ export implementation
   */
  private async exportToOBJInternal(model: any, onProgress?: ProgressCallback): Promise<Blob> {
    onProgress?.(25, 'Converting model to OBJ format...');
    
    // Use library function to export to OBJ
    const objBlob = exportToOBJ(model);
    
    onProgress?.(75, 'OBJ export complete');
    return objBlob;
  }
  
  /**
   * Internal GLB export implementation
   */
  private async exportToGLBInternal(model: any, onProgress?: ProgressCallback): Promise<Blob> {
    onProgress?.(25, 'Converting model to GLB format...');
    
    // Use library function to export to GLB (this is async)
    const glbBlob = await manifoldToGLB(model);
    
    onProgress?.(75, 'GLB export complete');
    return glbBlob;
  }
  
  /**
   * Get format by ID
   */
  getFormat(formatId: string): ExportFormat | undefined {
    return EXPORT_FORMATS.find(f => f.id === formatId);
  }
  
  /**
   * Check if format is supported
   */
  isFormatSupported(formatId: string): boolean {
    return EXPORT_FORMATS.some(f => f.id === formatId);
  }
  
  /**
   * Get export statistics (for debugging)
   */
  getExportStats(): { 
    supportedFormats: number;
    managedUrls: number;
  } {
    return {
      supportedFormats: EXPORT_FORMATS.length,
      managedUrls: this.urlService.getManagedUrlCount()
    };
  }
}

/**
 * Factory function to create export service
 */
export function createExportService(urlService: IUrlService): IExportService {
  return new ExportService(urlService);
}