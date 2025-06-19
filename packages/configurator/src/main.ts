/**
 * ManifoldCAD Preview Environment - Main Module
 *
 * V3 Pipeline-Based Architecture
 *
 * This is the entry point for the V3 configurator, using the pipeline-based model system.
 */
import "./style.css";
import "./components"; // Register all web components
import { currentModelId, loadModel, updateStatus, initializeStore } from "./state/store";
import { createModelViewer } from "./core/preview";
import { setModelService } from "./services";

// V3 Pipeline System
import { createV3ModelService } from "./services/V3ModelService.js";
import { Manifold, CrossSection } from '@manifold-studio/wrapper';

console.log('🚀 Starting V3 Pipeline Configurator...');

// Get DOM elements
const modelViewerElement = document.getElementById("viewer") as any;

// Create the model viewer controller
createModelViewer({
  modelViewer: modelViewerElement
});

// Set up model viewer event handlers
if (modelViewerElement) {
  // Model loaded event
  modelViewerElement.addEventListener('load', () => {
    console.log('Model viewer: Model loaded');
  });
  
  // Error handling
  modelViewerElement.addEventListener('error', (error: any) => {
    console.error('Model viewer error:', error);
    updateStatus(`Model viewer error: ${error.detail.sourceError.message || 'Unknown error'}`, true);
  });
}

// Application context for HMR
// const appContext = {
//   currentModelId: currentModelId.value,
//   modelViewer
// };

// V3 uses pipeline-based HMR (automatic pipeline reloading)
// No need for legacy HMR setup

/**
 * Initialize V3 Pipeline System
 */
async function initializeV3() {
  console.log("🔧 Initializing V3 Pipeline System...");

  // Make Manifold available globally for pipeline models
  (globalThis as any).manifold = Manifold;
  (globalThis as any).CrossSection = CrossSection;
  console.log("✅ Manifold initialized and available globally");

  // Initialize V3 model service
  const v3ModelService = createV3ModelService('/temp/pipeline.js');
  await v3ModelService.initialize();

  // Set V3 service as the model service
  setModelService(v3ModelService);

  console.log("✅ V3 Pipeline System initialized");
}

/**
 * Main function to run the V3 preview environment
 */
async function runPreview() {
  try {
    console.log("Starting V3 Pipeline Configurator");

    // Initialize V3 Pipeline System
    updateStatus("Initializing V3 Pipeline System...");
    await initializeV3();

    // Initialize store with V3 models
    updateStatus("Loading V3 models...");
    await initializeStore();

    updateStatus("V3 Pipeline System ready");

    // Update initial status
    updateStatus("Starting V3 configurator...");

    // Load the default model using our state management
    await loadModel(currentModelId.value);

    // Any additional setup after model is loaded
    console.log("V3 model loaded successfully");

  } catch (error: any) {
    console.error("Error in V3 preview:", error);
    updateStatus(`Error: ${error.message}`, true);
  }
}

// Run the V3 preview
runPreview();