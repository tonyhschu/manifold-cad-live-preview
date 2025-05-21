// src/core/preview.ts
/**
 * ManifoldCAD Preview System
 *
 * This module provides the UI and rendering functionality for displaying 3D models.
 * It handles model loading, viewer configuration, and UI interactions.
 */

import { exportToOBJ, createModelUrl } from "../lib/export";
import { manifoldToGLB, createGLBUrl } from "../lib/gltf-export";
import { getInitCount } from "../lib/manifold";
import {
  getAvailableModels,
  loadModelById,
  ModelMetadata,
} from "./model-loader";

/** Function type for model change callbacks */
type ModelChangeCallback = (modelId: string) => void;

/** Configuration options for the preview system */
interface PreviewOptions {
  /** Status element to display messages */
  statusElement: HTMLElement;
  /** Model viewer element for 3D visualization */
  modelViewer: any; // model-viewer element
  /** Container for app UI */
  appContainer: HTMLElement;
}

/**
 * ManifoldCAD Preview Class
 *
 * This class manages the 3D model preview experience, handling:
 * - UI components and interactions
 * - Model selection and loading
 * - 3D rendering and visualization
 * - Export functionality
 */
export class ManifoldPreview {
  private statusElement: HTMLElement;
  private modelViewer: any;
  private appContainer: HTMLElement;
  private modelSelectContainer: HTMLElement | null = null;
  private resultContainer: HTMLElement | null = null;
  private currentModelId: string = "demo";
  private modelChangeListeners: ModelChangeCallback[] = [];

  /**
   * Create a new ManifoldCAD preview
   * @param options Configuration options for the preview
   */
  constructor(options: PreviewOptions) {
    this.statusElement = options.statusElement;
    this.modelViewer = options.modelViewer;
    this.appContainer = options.appContainer;

    // Create a container for results that won't be cleared
    this.resultContainer = document.createElement("div");
    this.resultContainer.id = "preview-results";

    // Find the viewer container element
    const viewerContainer = document.getElementById("viewer-container");

    // Insert the result container after the viewer container
    if (viewerContainer && viewerContainer.parentNode) {
      viewerContainer.parentNode.insertBefore(
        this.resultContainer,
        viewerContainer.nextSibling
      );
    } else {
      // Fallback: append to app container
      this.appContainer.appendChild(this.resultContainer);
    }

    // Initialize the preview
    this.initializeViewer();
    this.createModelSelector();
  }

  /**
   * Initialize the 3D model viewer with default settings
   */
  private initializeViewer() {
    // Set up the model viewer
    if (this.modelViewer) {
      this.modelViewer.style.display = "block"; // Always visible
      this.modelViewer.shadowIntensity = 1;
      this.modelViewer.cameraControls = true;
      this.modelViewer.autoRotate = false;
      this.modelViewer.exposure = 1.0;
    }

    // Update status
    this.updateStatus("Initializing Manifold...");
  }

  /**
   * Create the model selector dropdown UI
   */
  private createModelSelector() {
    // Create container
    const container = document.createElement("div");
    container.className = "model-selector";
    container.style.margin = "10px 0";

    // Create label
    const label = document.createElement("label");
    label.textContent = "Select model: ";
    label.htmlFor = "model-select";
    container.appendChild(label);

    // Create select element
    const select = document.createElement("select");
    select.id = "model-select";

    // Add options for each available model
    const models = getAvailableModels();
    models.forEach((model) => {
      const option = document.createElement("option");
      option.value = model.id;
      option.textContent = model.name;
      select.appendChild(option);
    });

    // Add change handler
    select.addEventListener("change", async (e) => {
      const modelId = (e.target as HTMLSelectElement).value;
      this.loadAndRenderModel(modelId);
    });

    container.appendChild(select);

    // Add to context section instead of results container
    const contextSection = document.getElementById("context");
    if (contextSection) {
      // Find the metadata section or add after it
      const metadataSection = contextSection.querySelector(
        '[aria-label="metadata"]'
      );
      if (metadataSection) {
        contextSection.insertBefore(container, metadataSection.nextSibling);
      } else {
        contextSection.appendChild(container);
      }
    } else if (this.resultContainer) {
      // Fallback to results container if context section not found
      this.resultContainer.appendChild(container);
    }

    this.modelSelectContainer = container;
  }

  /**
   * Register a callback to be notified when the current model changes
   * Used by HMR to track the current model
   *
   * @param callback Function to call when the model changes
   */
  public onModelChange(callback: ModelChangeCallback): void {
    this.modelChangeListeners.push(callback);
  }

  /**
   * Load and render a model by ID
   * @param modelId The ID of the model to load
   */
  public async loadAndRenderModel(modelId: string) {
    try {
      // Update current model ID
      this.currentModelId = modelId;

      // Notify listeners
      this.modelChangeListeners.forEach((listener) => listener(modelId));

      this.updateStatus(`Loading model: ${modelId}...`);

      // Load the model
      const { model, metadata } = await loadModelById(modelId);

      // Render the model
      await this.renderModel(model, metadata);
    } catch (error: any) {
      console.error(`Error loading model ${modelId}:`, error);
      this.updateStatus(`Error loading model: ${error.message}`, true);
    }
  }

  /**
   * Update the status message display
   * @param message The message to display
   * @param isError Whether this is an error message
   */
  public updateStatus(message: string, isError = false) {
    this.statusElement.textContent = message;
    this.statusElement.className = isError ? "error" : "";
  }

  /**
   * Get the ID of the currently displayed model
   * @returns The current model ID
   */
  public getCurrentModelId(): string {
    return this.currentModelId;
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
        const srcWithoutQuery = currentSrc.split("?")[0];
        this.modelViewer.src = `${srcWithoutQuery}${cacheBust}`;

        // Update status
        this.updateStatus("View refreshed");
        console.log("ManifoldCAD: View refreshed");
      }
    }
  }

  /**
   * Render a manifold model in the preview
   * @param model The manifold model to render
   * @param modelMetadata Optional metadata about the model
   */
  public async renderModel(model: any, modelMetadata?: ModelMetadata) {
    try {
      // Step 1: Export the model to OBJ and GLB
      this.updateStatus("Exporting model to OBJ and GLB...");

      // Export model to OBJ (synchronous)
      const objBlob = exportToOBJ(model);
      const objUrl = createModelUrl(objBlob);

      // Export to GLB for model-viewer (still has async components due to glTF-transform)
      this.updateStatus("Generating GLB for model-viewer...");
      const glbBlob = await manifoldToGLB(model);
      const glbUrl = createGLBUrl(glbBlob);

      // Update the model viewer with the GLB URL
      if (this.modelViewer) {
        this.modelViewer.src = glbUrl;
        this.modelViewer.alt = modelMetadata?.description || "A 3D model";
        this.modelViewer.style.display = "block";
      }

      // Clear previous content in the result container
      if (this.resultContainer) {
        // Remove all children except the model selector
        const childrenToRemove = Array.from(
          this.resultContainer.children
        ).filter((child) => child !== this.modelSelectContainer);
        childrenToRemove.forEach((child) => {
          if (this.resultContainer) {
            this.resultContainer.removeChild(child);
          }
        });
      }

      // Update metadata in the context section
      const contextSection = document.getElementById("context");
      if (contextSection) {
        // Find metadata section
        const metadataSection = contextSection.querySelector(
          '[aria-label="metadata"]'
        );
        if (metadataSection) {
          // Update title
          const titleElement = metadataSection.querySelector("h1");
          if (titleElement) {
            titleElement.textContent = modelMetadata?.name || "Model Preview";
          }

          // Update description
          const descriptionContainer = metadataSection.querySelector("div");
          if (descriptionContainer) {
            const descriptionElement = descriptionContainer.querySelector("p");
            if (descriptionElement) {
              descriptionElement.textContent =
                modelMetadata?.description ||
                "Successfully created a 3D model using ManifoldCAD.";
            }
          }
        }
      } else {
        // Fallback: add to result container if context section not found
        const resultMessage = document.createElement("div");
        resultMessage.innerHTML = `<h3>${
          modelMetadata?.name || "Model Preview"
        }</h3>
        <p>${
          modelMetadata?.description ||
          "Successfully created a 3D model using ManifoldCAD."
        }</p>`;

        if (this.resultContainer) {
          this.resultContainer.appendChild(resultMessage);
        }
      }

      // Add the download links
      const downloadContainer = document.createElement("div");
      downloadContainer.className = "download-container";

      const objDownloadLink = document.createElement("a");
      objDownloadLink.href = objUrl;
      objDownloadLink.download = "manifold-model.obj";
      objDownloadLink.textContent = "Download OBJ Model";
      objDownloadLink.className = "download-btn";

      const glbDownloadLink = document.createElement("a");
      glbDownloadLink.href = glbUrl;
      glbDownloadLink.download = "manifold-model.glb";
      glbDownloadLink.textContent = "Download GLB Model";
      glbDownloadLink.className = "download-btn";

      downloadContainer.appendChild(objDownloadLink);
      downloadContainer.appendChild(glbDownloadLink);

      // Add to context section if available (reuse existing contextSection variable)
      if (contextSection) {
        const existingDownloadContainer = contextSection.querySelector(
          ".download-container"
        );
        if (existingDownloadContainer) {
          contextSection.replaceChild(
            downloadContainer,
            existingDownloadContainer
          );
        } else {
          contextSection.appendChild(downloadContainer);
        }
      } else if (this.resultContainer) {
        // Fallback to results container
        this.resultContainer.appendChild(downloadContainer);
      }

      console.log("Preview completed successfully");
    } catch (error: any) {
      console.error("Error in preview:", error);
      this.updateStatus(`Error: ${error.message}`, true);
    }
  }
}

/**
 * Create a new preview instance
 * @param options Configuration options for the preview
 * @returns A new ManifoldPreview instance
 */
export function createPreview(options: PreviewOptions): ManifoldPreview {
  return new ManifoldPreview(options);
}
