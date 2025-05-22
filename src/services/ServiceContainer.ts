/**
 * Service Container - Dependency Injection for Services
 * 
 * Provides centralized service management and dependency injection
 * for the adapter layer.
 */

import { IModelService, IExportService, IUrlService } from './interfaces';

/**
 * Service container for managing adapter layer dependencies
 */
export class ServiceContainer {
  private static instance: ServiceContainer | null = null;
  
  private modelService: IModelService | null = null;
  private exportService: IExportService | null = null;
  private urlService: IUrlService | null = null;
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }
  
  /**
   * Register services
   */
  registerModelService(service: IModelService): void {
    this.modelService = service;
  }
  
  registerExportService(service: IExportService): void {
    this.exportService = service;
  }
  
  registerUrlService(service: IUrlService): void {
    this.urlService = service;
  }
  
  /**
   * Get services
   */
  getModelService(): IModelService {
    if (!this.modelService) {
      throw new Error('ModelService not registered');
    }
    return this.modelService;
  }
  
  getExportService(): IExportService {
    if (!this.exportService) {
      throw new Error('ExportService not registered');
    }
    return this.exportService;
  }
  
  getUrlService(): IUrlService {
    if (!this.urlService) {
      throw new Error('UrlService not registered');
    }
    return this.urlService;
  }
  
  /**
   * Cleanup all services
   */
  cleanup(): void {
    this.exportService?.cleanup();
    this.urlService?.cleanup();
  }
  
  /**
   * Reset container (for testing)
   */
  static reset(): void {
    if (ServiceContainer.instance) {
      ServiceContainer.instance.cleanup();
      ServiceContainer.instance = null;
    }
  }
}

/**
 * Convenience functions for accessing services
 */
export const getModelService = () => ServiceContainer.getInstance().getModelService();
export const getExportService = () => ServiceContainer.getInstance().getExportService();
export const getUrlService = () => ServiceContainer.getInstance().getUrlService();