/**
 * Simple HMR System - Clean Linear Architecture
 * 
 * File Change → Rebuild All Models → Generate Current Blob → Update UI
 */

import { refreshAvailableModels, loadModel, currentModelId } from './state/store';

/**
 * Setup simple HMR for model files
 */
export const setupSimpleHMR = (): void => {
  if (!import.meta.hot) {
    console.log('❌ HMR not available');
    return;
  }

  console.log('🔥 Setting up Simple HMR...');

  // Listen for any file changes
  import.meta.hot.on('vite:afterUpdate', async (data) => {
    console.log('🔄 HMR: File change detected:', data);
    debugger; // STOP HERE - is this even firing?

    // Check if any updated files are model files
    const updatedFiles = data?.updates?.map((u: any) => u.path) || [];
    console.log('🔍 HMR: All updated files:', updatedFiles);

    const modelFileUpdated = updatedFiles.some((file: string) =>
      file.includes('/main.') ||
      file.includes('/components/') ||
      file.endsWith('main.ts') ||
      file.endsWith('main.js') ||
      file.includes('components')
    );

    console.log('🔍 HMR: Model file updated?', modelFileUpdated);
    debugger; // STOP HERE - what files were detected?

    if (modelFileUpdated) {
      console.log('📝 HMR: Model files changed - triggering rebuild');
      debugger; // STOP HERE - about to trigger rebuild
      await handleModelFileChange();
    } else {
      console.log('📝 HMR: No model files in this update, skipping');
    }
  });

  console.log('✅ Simple HMR setup complete');
};

/**
 * Handle model file changes with clean linear flow
 */
async function handleModelFileChange(): Promise<void> {
  try {
    console.log('🔄 HMR: Starting model rebuild...');
    debugger; // STOP HERE - did we get to the rebuild function?

    // 1. Preserve current state
    const currentModel = currentModelId.value;
    const currentUrl = new URL(window.location.href);
    console.log('📋 HMR: Current model:', currentModel);

    // 2. Rebuild all models (no cache, fresh imports)
    console.log('🏗️ HMR: Rebuilding all models...');
    await rebuildAllModels();

    // 3. Refresh model registry
    console.log('📋 HMR: Refreshing model registry...');
    await refreshAvailableModels();

    // 4. If we had a current model, reload it with fresh blob
    if (currentModel) {
      console.log(`🎯 HMR: Regenerating blob for current model: ${currentModel}`);
      debugger; // STOP HERE - about to call loadModel
      await regenerateCurrentModelBlob(currentModel);
    } else {
      console.log('⚠️ HMR: No current model to regenerate');
    }

    // 5. Preserve state in URL
    if (currentModel) {
      currentUrl.searchParams.set('model', currentModel);
      window.history.replaceState({}, '', currentUrl.toString());
    }

    console.log('✅ HMR: Model rebuild complete');

  } catch (error) {
    console.error('❌ HMR: Error during model rebuild:', error);
  }
}

/**
 * Rebuild all models by invalidating imports
 */
async function rebuildAllModels(): Promise<void> {
  // Force Vite to invalidate all dynamic imports by adding timestamp
  const timestamp = Date.now();
  (globalThis as any).__MODEL_REBUILD_TIMESTAMP__ = timestamp;
  console.log(`🕐 Model rebuild timestamp: ${timestamp}`);
}

/**
 * Regenerate blob for current model (no cache)
 */
async function regenerateCurrentModelBlob(modelId: string): Promise<void> {
  try {
    // Force fresh load (no cache)
    console.log(`🔄 Loading fresh model: ${modelId}`);
    await loadModel(modelId);
    console.log(`✅ Fresh blob generated for: ${modelId}`);
    
  } catch (error) {
    console.error(`❌ Error regenerating blob for ${modelId}:`, error);
    throw error;
  }
}
