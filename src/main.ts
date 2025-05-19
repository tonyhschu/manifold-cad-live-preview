import "./style.css";
import { createPreview } from "./core/preview";

// Get DOM elements
const statusElement = document.getElementById("status") as HTMLDivElement;
const modelViewer = document.querySelector("model-viewer") as any;
const appContainer = document.getElementById("app") as HTMLDivElement;

// Create the preview handler
const preview = createPreview({
  statusElement,
  modelViewer,
  appContainer
});

// Main async function to run the preview
async function runPreview() {
  try {
    console.log("Starting ManifoldCAD preview");
    
    // Load the default model (will be handled by the preview system)
    await preview.loadAndRenderModel('default');
    
  } catch (error: any) {
    console.error("Error in preview:", error);
    preview.updateStatus(`Error: ${error.message}`, true);
  }
}

// Run the preview
runPreview();