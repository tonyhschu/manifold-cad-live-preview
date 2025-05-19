// src/core/preview.ts
// Handles the preview UI functionality

import { exportToOBJ, createModelUrl } from "../lib/utilities";
import { manifoldToGLB, createGLBUrl } from "../lib/gltf-export";
import { manifoldContext } from "../lib/manifold-context";
import { getAvailableModels, loadModelById, ModelMetadata } from "./model-loader";

interface PreviewOptions {
  statusElement: HTMLElement;
  modelViewer: any; // model-viewer element
  appContainer: HTMLElement;
}

export class ManifoldPreview {
  private statusElement: HTMLElement;
  private modelViewer: any;
  private appContainer: HTMLElement;
  private modelSelectContainer: HTMLElement | null = null;
  
  constructor(options: PreviewOptions) {
    this.statusElement = options.statusElement;
    this.modelViewer = options.modelViewer;
    this.appContainer = options.appContainer;
    
    // Initialize the preview
    this.initializeViewer();
    this.createModelSelector();
  }
  
  private initializeViewer() {
    // Set up the model viewer
    if (this.modelViewer) {
      this.modelViewer.style.display = "none";
      this.modelViewer.shadowIntensity = 1;
      this.modelViewer.cameraControls = true;
      this.modelViewer.autoRotate = false;
      this.modelViewer.exposure = 1.0;
    }
    
    // Update status
    this.updateStatus("Initializing Manifold...");
  }
  
  /**
   * Create a model selector dropdown
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
    models.forEach(model => {
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
    
    // Insert at the top of the app container
    if (this.appContainer.firstChild) {
      this.appContainer.insertBefore(container, this.appContainer.firstChild);
    } else {
      this.appContainer.appendChild(container);
    }
    
    this.modelSelectContainer = container;
  }
  
  /**
   * Load and render a model by ID
   */
  public async loadAndRenderModel(modelId: string) {
    try {
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
   * Update the status message
   */
  public updateStatus(message: string, isError = false) {
    this.statusElement.textContent = message;
    this.statusElement.className = isError ? "error" : "";
  }
  
  /**
   * Render a manifold model in the preview
   */
  public async renderModel(model: any, modelMetadata?: ModelMetadata) {
    try {
      // Step 1: Export the model to OBJ and GLB
      this.updateStatus("Exporting model to OBJ and GLB...");
      const objBlob = await exportToOBJ(model);
      const objUrl = createModelUrl(objBlob);
      
      // Export to GLB for model-viewer
      this.updateStatus("Generating GLB for model-viewer...");
      const glbBlob = await manifoldToGLB(model);
      const glbUrl = createGLBUrl(glbBlob);
      
      // Update the model viewer with the GLB URL
      if (this.modelViewer) {
        this.modelViewer.src = glbUrl;
        this.modelViewer.alt = modelMetadata?.description || "A 3D model";
        this.modelViewer.style.display = "block";
      }
      
      // Add a message explaining the results
      const resultMessage = document.createElement("div");
      resultMessage.innerHTML = `<h3>${modelMetadata?.name || "Model Preview"}</h3>
      <p>${modelMetadata?.description || "Successfully created a 3D model using ManifoldCAD."}</p>`;
      
      // Clear previous content (except the model selector)
      const childrenToRemove = Array.from(this.appContainer.children).filter(
        child => child !== this.modelSelectContainer
      );
      childrenToRemove.forEach(child => this.appContainer.removeChild(child));
      
      // Add the new content
      this.appContainer.appendChild(resultMessage);
      
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
      
      this.appContainer.appendChild(downloadContainer);
      
      // Show success message with initialization count
      const initCount = manifoldContext.getInitCount();
      this.statusElement.innerHTML = `Success! Manifold was initialized <strong>${initCount} time(s)</strong> even though we used it in multiple modules.`;
      this.statusElement.className = "success";
      
      console.log("Preview completed successfully");
    } catch (error: any) {
      console.error("Error in preview:", error);
      this.updateStatus(`Error: ${error.message}`, true);
    }
  }
}

/**
 * Create a new preview instance
 */
export function createPreview(options: PreviewOptions): ManifoldPreview {
  return new ManifoldPreview(options);
}