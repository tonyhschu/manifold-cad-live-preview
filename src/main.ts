import "./style.css";
import { manifoldContext, withModule } from "./lib/manifold-context";
import {
  cube,
  cylinder,
  sphere,
  union,
  difference,
  createManifoldFactory,
  exportToOBJ,
  createModelUrl,
} from "./lib/utilities";
import { manifoldToGLB, createGLBUrl } from "./lib/gltf-export";

// Get DOM elements
const statusElement = document.getElementById("status") as HTMLDivElement;
const modelViewer = document.querySelector("model-viewer") as any;

// Set up the model viewer
if (modelViewer) {
  modelViewer.style.display = "none";
  modelViewer.shadowIntensity = 1;
  modelViewer.cameraControls = true;
  modelViewer.autoRotate = false;
  modelViewer.exposure = 1.0;
}

// Update status
statusElement.textContent = "Initializing Manifold...";

// Main async function to test the Manifold context pattern
async function runDemo() {
  try {
    console.log("Starting Manifold context pattern demo");

    // First, let's test the direct access to Manifold to verify our module loads correctly
    await withModule((module) => {
      console.log("Manifold module loaded successfully", module);
      const testCube = module.Manifold.cube([5, 5, 5]);
      console.log("Test cube created directly", testCube);
    });

    // Step 1: Create shapes using our wrapped utility functions
    statusElement.textContent = "Creating primitive shapes...";
    const shape1 = await cube([10, 10, 10]);
    const shape2 = await cylinder(5, 15, 32);

    console.log("Created cube", shape1);
    console.log("Created cylinder", shape2);

    // Step 2: Use a boolean operation
    statusElement.textContent = "Performing boolean operations...";
    const combined = await union([shape1, shape2]);
    console.log("Union result", combined);

    // Step 3: Create and use a factory (object-oriented approach)
    statusElement.textContent = "Creating and using factory...";
    const factory = await createManifoldFactory();

    // Step 4: Create another shape using the factory
    const ball = factory.sphere(7);
    console.log("Created sphere using factory", ball);

    // Step 5: Perform another boolean operation using the factory
    const finalModel = factory.difference(combined, ball);
    console.log("Final model after boolean operations", finalModel);

    // Step 6: Export the model to OBJ and GLB
    statusElement.textContent = "Exporting model to OBJ and GLB...";
    const objBlob = await exportToOBJ(finalModel);
    const objUrl = createModelUrl(objBlob);

    // Export to GLB for model-viewer
    statusElement.textContent = "Generating GLB for model-viewer...";
    const glbBlob = await manifoldToGLB(finalModel);
    const glbUrl = createGLBUrl(glbBlob);

    // Update the model viewer with the GLB URL
    if (modelViewer) {
      modelViewer.src = glbUrl;
      modelViewer.alt = "A 3D model of a cube with a cylinder, minus a sphere";
      modelViewer.style.display = "block";
    }

    // Add a message explaining the results
    const resultMessage = document.createElement("div");
    resultMessage.innerHTML = `<h3>Demo Results</h3>
    <p>Successfully created and performed operations on a 3D model using the Manifold context pattern.</p>
    <p>The model is a cube joined with a cylinder, with a sphere subtracted from it.</p>
    <p>You can download the OBJ file below to view the model in any 3D viewer that supports OBJ format.</p>`;

    // Get the app container and add the message
    const appContainer = document.getElementById("app");
    appContainer?.appendChild(resultMessage);

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

    appContainer?.appendChild(downloadContainer);

    // Step 8: Show success message with initialization count
    const initCount = manifoldContext.getInitCount();
    statusElement.innerHTML = `Success! Manifold was initialized <strong>${initCount} time(s)</strong> even though we used it in multiple modules.`;
    statusElement.className = "success";

    console.log("Demo completed successfully");
  } catch (error) {
    console.error("Error in demo:", error);
    // @ts-ignore
    statusElement.textContent = `Error: ${error.message}`;
    statusElement.className = "error";
  }
}

// Run the demo
runDemo();
