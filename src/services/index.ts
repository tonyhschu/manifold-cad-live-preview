/**
 * Services Module - Adapter Layer Entry Point
 * 
 * Provides centralized access to all services and handles initialization.
 */

// Export interfaces
export * from './interfaces';

// Export service implementations
export * from './UrlService';
export * from './ExportService';
export * from './ModelService';
export * from './ServiceContainer';

// Service creation functions
import { createUrlService } from './UrlService';
import { createExportService } from './ExportService';
import { createModelService } from './ModelService';
import { ServiceContainer } from './ServiceContainer';

/**
 * Initialize all services and register them with the container
 */
export function initializeServices(): ServiceContainer {
  const container = ServiceContainer.getInstance();
  
  // Create services in dependency order
  const urlService = createUrlService();
  const exportService = createExportService(urlService);
  const modelService = createModelService(exportService);
  
  // Register services
  container.registerUrlService(urlService);
  container.registerExportService(exportService);
  container.registerModelService(modelService);
  
  return container;
}

/**
 * Cleanup all services
 */
export function cleanupServices(): void {
  const container = ServiceContainer.getInstance();
  container.cleanup();
}

// Re-export convenience functions
export { getModelService, getExportService, getUrlService } from './ServiceContainer';