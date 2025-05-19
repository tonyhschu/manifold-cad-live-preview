import './style.css';
import { manifoldContext } from './lib/manifold-context';
import { createCube, createCylinder, createPrimitiveFactory } from './lib/primitives';
import { union, difference, createOperationsFactory } from './lib/operations';
import { exportToGLB, createModelUrl } from './lib/export-utils';

// Get DOM elements
const statusElement = document.getElementById('status') as HTMLDivElement;
const modelViewer = document.querySelector('model-viewer') as any;

// Update status
statusElement.textContent = 'Initializing Manifold...';

// Main async function to test the Manifold context pattern
async function runDemo() {
  try {
    console.log('Starting Manifold context pattern demo');
    
    // Step 1: Create shapes using the function-based approach
    statusElement.textContent = 'Creating primitive shapes...';
    const cube = await createCube([10, 10, 10]);
    const cylinder = await createCylinder(5, 15, 32);
    
    // Step 2: Use a boolean operation with the function-based approach
    statusElement.textContent = 'Performing boolean operations...';
    const union1 = await union([cube, cylinder]);
    
    // Step 3: Now, create a factory and use it (showing object-oriented approach)
    statusElement.textContent = 'Creating and using factories...';
    const primitiveFactory = await createPrimitiveFactory();
    const operationsFactory = await createOperationsFactory();
    
    // Step 4: Create more shapes using the factory
    const sphere = primitiveFactory.sphere(7);
    
    // Step 5: Perform another boolean operation using the factory
    const finalModel = operationsFactory.difference(union1, sphere);
    
    // Step 6: Export the model to GLB
    statusElement.textContent = 'Exporting model to GLB...';
    const glbBlob = await exportToGLB(finalModel);
    const modelUrl = createModelUrl(glbBlob);
    
    // Step 7: Display the model in the model-viewer
    modelViewer.src = modelUrl;
    
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

