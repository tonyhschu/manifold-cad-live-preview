// src/core/hmr-handler.ts
/**
 * Hot Module Replacement (HMR) Handler
 * 
 * This module provides functionality for handling hot module replacement
 * with Vite, allowing for a smooth development experience with live updates.
 */

import { ManifoldPreview } from './preview';

// Current model ID store for HMR
interface HMRState {
  currentModelId: string;
  modelReloadAttempts: Record<string, number>;
  lastModifiedModelFile: string | null;
}

/**
 * Initialize HMR for the ManifoldCAD preview environment
 * 
 * @param preview The preview instance to refresh on changes
 * @param initialModelId The initially loaded model ID
 */
export function initializeHMR(preview: ManifoldPreview, initialModelId: string): void {
  // Only run in development mode when HMR is available
  if (import.meta.hot) {
    console.log('ManifoldCAD HMR: Initializing...');
    
    // Store the current model ID for HMR state preservation
    let state: HMRState = import.meta.hot.data.state || { 
      currentModelId: initialModelId,
      modelReloadAttempts: {},
      lastModifiedModelFile: null
    };
    
    // Update the state when the model changes
    preview.onModelChange((modelId: string) => {
      state.currentModelId = modelId;
    });
    
    // Preserve state between HMR updates
    import.meta.hot.dispose(data => {
      data.state = state;
      console.log('ManifoldCAD HMR: State preserved', data.state);
    });
    
    // Handle updates to model files
    import.meta.hot.accept('../models/demo.ts', (module) => {
      console.log('ManifoldCAD HMR: Demo model updated');
      handleModelUpdate('demo', module);
    });
    
    import.meta.hot.accept('../models/cube.ts', (module) => {
      console.log('ManifoldCAD HMR: Cube model updated');
      handleModelUpdate('cube', module);
    });
    
    import.meta.hot.accept('../models/compound.ts', (module) => {
      console.log('ManifoldCAD HMR: Compound model updated');
      handleModelUpdate('compound', module);
    });
    
    // Helper function to handle model updates
    function handleModelUpdate(modelId: string, module: any) {
      // Store the last modified model file
      state.lastModifiedModelFile = `../models/${modelId}.ts`;
      
      try {
        console.log(`ManifoldCAD HMR: Handling update for model ID: ${modelId}`);
        
        // If the current model matches the updated one, reload it
        if (modelId === state.currentModelId) {
          // Increment reload attempt counter
          state.modelReloadAttempts[state.currentModelId] = 
            (state.modelReloadAttempts[state.currentModelId] || 0) + 1;
            
          console.log(`ManifoldCAD HMR: Reloading current model ${state.currentModelId} (attempt ${state.modelReloadAttempts[state.currentModelId]})`);
          
          // Reload the current model
          preview.loadAndRenderModel(state.currentModelId).then(() => {
            console.log(`ManifoldCAD HMR: Successfully reloaded model ${state.currentModelId}`);
          }).catch(error => {
            console.error(`ManifoldCAD HMR: Error reloading model ${state.currentModelId}`, error);
            preview.updateStatus(`HMR Error: ${error.message}. Retry in progress...`, true);
            
            // If we've had multiple failures, we might want to force a full reload
            if (state.modelReloadAttempts[state.currentModelId] > 3) {
              console.warn(`ManifoldCAD HMR: Multiple reload failures for ${state.currentModelId}, forcing page reload`);
              import.meta.hot?.invalidate();
            }
          });
        } else {
          console.log(`ManifoldCAD HMR: Updated model ${modelId} different from current model (${state.currentModelId})`);
        }
      } catch (error) {
        console.error(`ManifoldCAD HMR: Error processing model update for ${modelId}`, error);
      }
    }
    
    // Handle updates to core library files individually
    // Manifold library
    import.meta.hot.accept('../lib/manifold.ts', () => {
      console.log('ManifoldCAD HMR: Manifold library updated');
      handleCoreLibraryUpdate('manifold');
    });
    
    // GLTF export
    import.meta.hot.accept('../lib/manifold-gltf.ts', () => {
      console.log('ManifoldCAD HMR: Manifold GLTF library updated');
      handleCoreLibraryUpdate('manifold-gltf');
    });
    
    // General export
    import.meta.hot.accept('../lib/gltf-export.ts', () => {
      console.log('ManifoldCAD HMR: GLTF export library updated');
      handleCoreLibraryUpdate('gltf-export');
    });
    
    // Export
    import.meta.hot.accept('../lib/export.ts', () => {
      console.log('ManifoldCAD HMR: Export library updated');
      handleCoreLibraryUpdate('export');
    });
    
    // Model loader
    import.meta.hot.accept('./model-loader.ts', () => {
      console.log('ManifoldCAD HMR: Model loader updated');
      handleCoreLibraryUpdate('model-loader');
    });
    
    // Preview
    import.meta.hot.accept('./preview.ts', () => {
      console.log('ManifoldCAD HMR: Preview updated');
      handleCoreLibraryUpdate('preview');
    });
    
    // Helper function to handle core library updates
    function handleCoreLibraryUpdate(libraryName: string) {
      try {
        // Reload the current model to reflect changes in core libraries
        console.log(`ManifoldCAD HMR: Core library "${libraryName}" changed, reloading current model ${state.currentModelId}`);
        preview.loadAndRenderModel(state.currentModelId).then(() => {
          console.log(`ManifoldCAD HMR: Successfully reloaded model with updated core library "${libraryName}"`);
        }).catch(error => {
          console.error(`ManifoldCAD HMR: Error reloading model with updated core library "${libraryName}"`, error);
          preview.updateStatus(`HMR Error in core library "${libraryName}": ${error.message}`, true);
          
          // Major core library changes might require a full reload
          import.meta.hot?.invalidate();
        });
      } catch (error) {
        console.error(`ManifoldCAD HMR: Error handling core library "${libraryName}" update`, error);
      }
    }
    
    // Listen for HMR errors
    import.meta.hot.on('vite:error', (error) => {
      console.error('ManifoldCAD HMR: Vite error', error);
      preview.updateStatus(`HMR Error: ${error.message || 'Unknown error'}`, true);
    });
    
    // Status update when HMR is about to update
    import.meta.hot.on('vite:beforeUpdate', (data) => {
      console.log('ManifoldCAD HMR: About to update', data);
      preview.updateStatus('HMR update in progress...');
    });
    
    // Status update when HMR has completed an update
    import.meta.hot.on('vite:afterUpdate', (data) => {
      console.log('ManifoldCAD HMR: Update applied', data);
      
      // Only update status if we didn't reload the model (which would have its own status)
      if (state.lastModifiedModelFile && !state.lastModifiedModelFile.includes(state.currentModelId)) {
        preview.updateStatus('HMR update complete. Select this model to see changes.');
      }
    });
    
    console.log('ManifoldCAD HMR: Initialized successfully');
  }
}