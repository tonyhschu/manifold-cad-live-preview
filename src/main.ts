import './style.css';
import { manifoldContext, withModule } from './lib/manifold-context';
import { cube, cylinder, sphere, union, difference, createManifoldFactory, exportToOBJ, createModelUrl } from './lib/utilities';

// Get DOM elements
const statusElement = document.getElementById('status') as HTMLDivElement;
const modelViewer = document.querySelector('model-viewer') as any;

// Update status
statusElement.textContent = 'Initializing Manifold...';

// Main async function to test the Manifold context pattern
async function runDemo() {
  try {
    console.log('Starting Manifold context pattern demo');
    
    // First, let's test the direct access to Manifold to verify our module loads correctly
    await withModule(module => {
      console.log('Manifold module loaded successfully', module);
      const testCube = module.Manifold.cube([5, 5, 5]);
      console.log('Test cube created directly', testCube);
    });
    
    // Step 1: Create shapes using our wrapped utility functions
    statusElement.textContent = 'Creating primitive shapes...';
    const shape1 = await cube([10, 10, 10]);
    const shape2 = await cylinder(5, 15, 32);
    
    console.log('Created cube', shape1);
    console.log('Created cylinder', shape2);
    
    // Step 2: Use a boolean operation 
    statusElement.textContent = 'Performing boolean operations...';
    const combined = await union([shape1, shape2]);
    console.log('Union result', combined);
    
    // Step 3: Create and use a factory (object-oriented approach)
    statusElement.textContent = 'Creating and using factory...';
    const factory = await createManifoldFactory();
    
    // Step 4: Create another shape using the factory
    const ball = factory.sphere(7);
    console.log('Created sphere using factory', ball);
    
    // Step 5: Perform another boolean operation using the factory
    const finalModel = factory.difference(combined, ball);
    console.log('Final model after boolean operations', finalModel);
    
    // Step 6: Export the model to OBJ
    statusElement.textContent = 'Exporting model to OBJ...';
    const objBlob = await exportToOBJ(finalModel);
    const modelUrl = createModelUrl(objBlob);
    
    // Step 7: Since model-viewer doesn't support OBJ, we'll just show a success message
    // and offer the file for download
    const downloadLink = document.createElement('a');
    downloadLink.href = modelUrl;
    downloadLink.download = 'manifold-model.obj';
    downloadLink.textContent = 'Download OBJ Model';
    downloadLink.className = 'download-btn';
    modelViewer.style.display = 'none';
    
    // Add the link after the status element
    statusElement.parentElement?.insertBefore(downloadLink, modelViewer);
    
    // Step 8: Show success message with initialization count
    const initCount = manifoldContext.getInitCount();
    statusElement.innerHTML = `Success! Manifold was initialized <strong>${initCount} time(s)</strong> even though we used it in multiple modules.`;
    statusElement.className = 'success';
    
    console.log('Demo completed successfully');
  } catch (error) {
    console.error('Error in demo:', error);
    statusElement.textContent = `Error: ${error.message}`;
    statusElement.className = 'error';
  }
}

// Run the demo
runDemo();

