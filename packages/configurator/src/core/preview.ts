// src/core/preview.ts
/**
 * ManifoldCAD Preview System
 *
 * This module provides the model viewer functionality.
 * It's been simplified to work with the Web Components architecture.
 */

import { getInitCount } from "@manifold-studio/wrapper";

/**
 * Configuration options for the model viewer
 */
export interface ModelViewerOptions {
  /** Model viewer element */
  modelViewer: any; // model-viewer element
}

/**
 * ModelViewer Controller Class
 *
 * Simplified to focus on model-viewer functionality now that UI components
 * have been moved to Web Components.
 */
export class ModelViewer {
  private modelViewer: any;

  /**
   * Create a new model viewer controller
   */
  constructor(options: ModelViewerOptions) {
    this.modelViewer = options.modelViewer;
    this.initializeViewer();
  }

  /**
   * Initialize the 3D model viewer with default settings
   */
  private initializeViewer() {
    if (this.modelViewer) {
      // Core model-viewer settings
      this.modelViewer.style.display = "block";
      this.modelViewer.shadowIntensity = 1;
      this.modelViewer.cameraControls = true;
      this.modelViewer.autoRotate = true;
      this.modelViewer.exposure = 1.0;

      console.log(`ManifoldCAD: Model viewer initialized (init count: ${getInitCount()})`);
    } else {
      console.error("ManifoldCAD: Model viewer element not found");
    }
  }

  /**
   * Refresh the view without reloading the model
   * Used by HMR to refresh styling or viewer options
   */
  public refreshView(): void {
    if (this.modelViewer) {
      // Force a refresh of the model-viewer
      const currentSrc = this.modelViewer.src;
      if (currentSrc) {
        // Add a cache-busting parameter
        const cacheBust = `?t=${Date.now()}`;
        const srcWithoutQuery = currentSrc.split('?')[0];
        this.modelViewer.src = `${srcWithoutQuery}${cacheBust}`;

        console.log("ManifoldCAD: View refreshed");
      }
    }
  }

  /**
   * Set the model source for the model-viewer
   */
  public setModelSource(src: string, alt: string = "A 3D model"): void {
    if (this.modelViewer) {
      this.modelViewer.src = src;
      this.modelViewer.alt = alt;
    }
  }
}

/**
 * Create a new model viewer instance
 */
export function createModelViewer(options: ModelViewerOptions): ModelViewer {
  return new ModelViewer(options);
}