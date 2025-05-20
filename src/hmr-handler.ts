// src/hmr-handler.ts
// Utility to handle Hot Module Replacement (HMR) for ManifoldCAD preview
// This file is a bridge to the core implementation in core/hmr-handler.ts

import { initializeHMR } from './core/hmr-handler';

/**
 * Check if HMR is available in the current environment
 */
export const isHMRAvailable = (): boolean => {
  return import.meta.hot !== undefined;
};

/**
 * Register handlers for all HMR events
 * @param context The application context (can include refs to DOM, state, etc.)
 */
export const setupHMR = (context: any): void => {
  if (!isHMRAvailable()) return;

  // If preview is available in context, use the core HMR implementation
  if (context.preview) {
    const currentModelId = context.currentModelId || 'demo';
    initializeHMR(context.preview, currentModelId);
    return;
  }

  // Fallback implementation for simpler use cases
  // Store context for HMR updates
  const hmrContext = context;

  // Register for HMR updates on the main module
  import.meta.hot?.accept((newModule) => {
    console.log('Main module updated:', newModule);
    if (hmrContext.preview && typeof hmrContext.preview.refreshView === 'function') {
      hmrContext.preview.refreshView();
    }
  });

  // Register for updates on model definitions - one by one
  import.meta.hot?.accept('./models/demo.ts', () => {
    console.log('Demo model updated');
    reloadModelIfCurrent('demo', hmrContext);
  });
  
  import.meta.hot?.accept('./models/cube.ts', () => {
    console.log('Cube model updated');
    reloadModelIfCurrent('cube', hmrContext);
  });
  
  import.meta.hot?.accept('./models/compound.ts', () => {
    console.log('Compound model updated');
    reloadModelIfCurrent('compound', hmrContext);
  });
  
  // Helper to reload the model if it's currently being displayed
  function reloadModelIfCurrent(modelId: string, context: any) {
    const currentModelId = context.currentModelId;
    if (currentModelId === modelId && context.preview) {
      console.log(`Reloading current model: ${modelId}`);
      context.preview.loadAndRenderModel(modelId);
    } else {
      console.log(`Model ${modelId} updated (not current model)`);
    }
  }

  // Listen to disposition events to clean up resources
  import.meta.hot?.dispose(() => {
    console.log('Module disposed for HMR update');
    // Cleanup code here (e.g., remove event listeners, dispose WebGL contexts)
  });
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