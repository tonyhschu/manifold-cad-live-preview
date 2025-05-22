/**
 * ManifoldCAD Preview Environment - Main Module
 *
 * This is the entry point for the application, handling initialization of the preview system,
 * setting up HMR, and loading the default model.
 */
import "./style.css";
import "./components"; // Register all web components
import { currentModelId, loadModel, updateStatus, initializeStore } from "./state/store";
import { createModelViewer } from "./core/preview";
import { setupHMR } from "./hmr-handler";
import { initializeServices } from "./services";

// Get DOM elements
const modelViewerElement = document.getElementById("viewer") as any;

// Create the model viewer controller
const modelViewer = createModelViewer({
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
const appContext = {
  currentModelId: currentModelId.value,
  modelViewer
};

// Initialize HMR for development
if (import.meta.hot !== undefined) {
  console.log("HMR is available - setting up handlers");
  setupHMR(appContext);
}

/**
 * Main function to run the preview environment
 */
async function runPreview() {
  try {
    console.log("Starting ManifoldCAD preview");
    
    // Initialize services first
    updateStatus("Initializing services...");
    initializeServices();
    
    // Initialize store (loads available models)
    updateStatus("Loading available models...");
    initializeStore();
    
    // Update initial status
    updateStatus("Starting ManifoldCAD preview...");
    
    // Load the default model using our state management
    await loadModel(currentModelId.value);
    
    // Any additional setup after model is loaded
    console.log("Model loaded successfully");
    
  } catch (error: any) {
    console.error("Error in preview:", error);
    updateStatus(`Error: ${error.message}`, true);
  }
}

// Run the preview
runPreview();