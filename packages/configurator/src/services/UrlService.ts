/**
 * UrlService - Browser URL and Blob Management
 *
 * Handles browser-specific URL/blob operations with automatic cleanup
 * and resource management. Encapsulates browser APIs for clean testing.
 */

import { IUrlService } from './interfaces';

/**
 * Implementation of URL service for browser environment
 */
export class UrlService implements IUrlService {
  private managedUrls = new Set<string>();

  /**
   * Create object URL from blob and track for cleanup
   */
  createObjectURL(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    this.managedUrls.add(url);
    return url;
  }

  /**
   * Revoke object URL and remove from tracking
   */
  revokeObjectURL(url: string): void {
    if (this.managedUrls.has(url)) {
      URL.revokeObjectURL(url);
      this.managedUrls.delete(url);
    }
  }

  /**
   * Generate filename with timestamp
   */
  generateFilename(baseName: string, extension: string): string {
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace(/T/, '_')
      .substring(0, 19);

    // Remove extension from baseName if it already has one
    const cleanBaseName = baseName.replace(/\.[^/.]+$/, '');

    // Ensure extension starts with dot
    const cleanExtension = extension.startsWith('.') ? extension : `.${extension}`;

    return `${cleanBaseName}_${timestamp}${cleanExtension}`;
  }

  /**
   * Cleanup all managed URLs
   */
  cleanup(): void {
    for (const url of this.managedUrls) {
      URL.revokeObjectURL(url);
    }
    this.managedUrls.clear();
  }

  /**
   * Get count of managed URLs (for debugging/monitoring)
   */
  getManagedUrlCount(): number {
    return this.managedUrls.size;
  }

  /**
   * Create download link for blob (convenience method)
   */
  createDownloadLink(blob: Blob, filename: string): HTMLAnchorElement {
    const url = this.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    return link;
  }

  /**
   * Trigger download of blob (convenience method)
   */
  downloadBlob(blob: Blob, filename: string): void {
    const link = this.createDownloadLink(blob, filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup URL after a short delay to ensure download started
    setTimeout(() => {
      this.revokeObjectURL(link.href);
    }, 1000);
  }
}

/**
 * Mock implementation for testing/Node.js environments
 */
export class MockUrlService implements IUrlService {
  private urlCounter = 0;
  private managedUrls = new Set<string>();

  createObjectURL(_blob: Blob): string {
    const mockUrl = `blob:mock-${++this.urlCounter}`;
    this.managedUrls.add(mockUrl);
    return mockUrl;
  }

  revokeObjectURL(url: string): void {
    this.managedUrls.delete(url);
  }

  generateFilename(baseName: string, extension: string): string {
    const cleanBaseName = baseName.replace(/\.[^/.]+$/, '');
    const cleanExtension = extension.startsWith('.') ? extension : `.${extension}`;
    return `${cleanBaseName}_mock${cleanExtension}`;
  }

  cleanup(): void {
    this.managedUrls.clear();
  }

  getManagedUrlCount(): number {
    return this.managedUrls.size;
  }
}

/**
 * Factory function to create appropriate URL service based on environment
 */
export function createUrlService(): IUrlService {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && typeof URL !== 'undefined') {
    return new UrlService();
  }

  // Return mock service for Node.js/testing
  return new MockUrlService();
}