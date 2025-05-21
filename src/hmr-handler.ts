/**
 * Hot Module Replacement (HMR) Handler
 * 
 * This module handles Hot Module Replacement for the application.
 * It's designed to work with the Preact Signals state management system.
 */

import { updateStatus, loadModel, currentModelId } from './state/store';

/**
 * Check if HMR is available in the current environment
 */
export const isHMRAvailable = (): boolean => {
  return import.meta.hot !== undefined;
};

interface HMRState {
  currentModelId: string;
  modelReloadAttempts: Record<string, number>;
  lastModifiedModelFile: string | null;
}

/**
 * Register handlers for all HMR events
 * @param context The application context
 */
export const setupHMR = (context: any): void => {
  if (!isHMRAvailable()) return;

  console.log('ManifoldCAD HMR: Initializing...');
  
  // Store state for HMR preservation
  let state: HMRState = import.meta.hot.data.state || { 
    currentModelId: currentModelId.value,
    modelReloadAttempts: {},
    lastModifiedModelFile: null
  };
  
  // Preserve state between HMR updates
  import.meta.hot.dispose(data => {
    data.state = state;
    console.log('ManifoldCAD HMR: State preserved', data.state);
  });
  
  // Handle updates to model files
  import.meta.hot.accept('./models/demo.ts', (module) => {
    console.log('ManifoldCAD HMR: Demo model updated');
    handleModelUpdate('demo', module);
  });
  
  import.meta.hot.accept('./models/cube.ts', (module) => {
    console.log('ManifoldCAD HMR: Cube model updated');
    handleModelUpdate('cube', module);
  });
  
  import.meta.hot.accept('./models/compound.ts', (module) => {
    console.log('ManifoldCAD HMR: Compound model updated');
    handleModelUpdate('compound', module);
  });
  
  // Helper function to handle model updates
  function handleModelUpdate(modelId: string, module: any) {
    // Store the last modified model file
    state.lastModifiedModelFile = `./models/${modelId}.ts`;
    
    try {
      console.log(`ManifoldCAD HMR: Handling update for model ID: ${modelId}`);
      
      // If the current model matches the updated one, reload it
      if (modelId === currentModelId.value) {
        // Increment reload attempt counter
        state.modelReloadAttempts[modelId] = 
          (state.modelReloadAttempts[modelId] || 0) + 1;
          
        console.log(`ManifoldCAD HMR: Reloading current model ${modelId} (attempt ${state.modelReloadAttempts[modelId]})`);
        
        // Reload the current model
        loadModel(modelId).then(() => {
          console.log(`ManifoldCAD HMR: Successfully reloaded model ${modelId}`);
        }).catch(error => {
          console.error(`ManifoldCAD HMR: Error reloading model ${modelId}`, error);
          updateStatus(`HMR Error: ${error.message}. Retry in progress...`, true);
          
          // If we've had multiple failures, we might want to force a full reload
          if (state.modelReloadAttempts[modelId] > 3) {
            console.warn(`ManifoldCAD HMR: Multiple reload failures for ${modelId}, forcing page reload`);
            import.meta.hot?.invalidate();
          }
        });
      } else {
        console.log(`ManifoldCAD HMR: Updated model ${modelId} different from current model (${currentModelId.value})`);
      }
    } catch (error) {
      console.error(`ManifoldCAD HMR: Error processing model update for ${modelId}`, error);
    }
  }
  
  // Listen for HMR errors
  import.meta.hot.on('vite:error', (error) => {
    console.error('ManifoldCAD HMR: Vite error', error);
    updateStatus(`HMR Error: ${error.message || 'Unknown error'}`, true);
  });
  
  // Status update when HMR is about to update
  import.meta.hot.on('vite:beforeUpdate', (data) => {
    console.log('ManifoldCAD HMR: About to update', data);
    updateStatus('HMR update in progress...');
  });
  
  // Status update when HMR has completed an update
  import.meta.hot.on('vite:afterUpdate', (data) => {
    console.log('ManifoldCAD HMR: Update applied', data);
    updateStatus('HMR update complete');
  });
  
  console.log('ManifoldCAD HMR: Initialized successfully');
};

/**
 * Force invalidation and reload of a module
 * This can be used when a non-critical error occurs during the update
 */
export const forceReload = (): void => {
  if (isHMRAvailable()) {
    import.meta.hot?.invalidate();
  }
};