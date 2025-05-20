/**
 * ManifoldCAD Preview Environment - Main Module
 * 
 * This is the entry point for the application, handling initialization of the preview system,
 * setting up HMR, and loading the default model.
 */
import "./style.css";
import { createPreview } from "./core/preview";
import { setupHMR } from "./hmr-handler";

// Default model to load on startup
const DEFAULT_MODEL_ID = "demo";

// Get DOM elements
const statusElement = document.getElementById("status") as HTMLDivElement;
const modelViewer = document.getElementById("viewer") as any;
const appContainer = document.getElementById("app") as HTMLDivElement;

// Create the preview handler
const preview = createPreview({
  statusElement,
  modelViewer,
  appContainer
});

// Application context for HMR
const appContext = {
  preview,
  currentModelId: DEFAULT_MODEL_ID,
  statusElement,
  modelViewer
};

// Initialize HMR for development
if (import.meta.hot) {
  console.log("HMR is available - setting up handlers");
  setupHMR(appContext);
}

/**
 * Main function to run the preview environment
 */
async function runPreview() {
  try {
    console.log("Starting ManifoldCAD preview");
    
    // Load the default model
    await preview.loadAndRenderModel(DEFAULT_MODEL_ID);
    
  } catch (error: any) {
    console.error("Error in preview:", error);
    preview.updateStatus(`Error: ${error.message}`, true);
  }
}

// Run the preview
runPreview();