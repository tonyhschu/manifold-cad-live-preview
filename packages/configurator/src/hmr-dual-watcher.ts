/**
 * Dual HMR Watcher System
 * 
 * This module implements the two-watcher HMR architecture:
 * 1. User Project Watcher (always active) - watches model files
 * 2. Monorepo Watcher (conditional) - watches framework packages
 */

import { refreshAvailableModels, loadModel, currentModelId } from './state/store';
import { getModelService } from './services';

/**
 * Check if HMR is available in the current environment
 */
export const isHMRAvailable = (): boolean => {
  return import.meta.hot !== undefined;
};

/**
 * State preservation for HMR updates
 */
interface HMRState {
  cameraOrbit?: string;
  cameraTarget?: string;
  parameterValues?: Record<string, any>;
  lastModelUpdate?: string;
  selectedModelId?: string;
}

/**
 * Setup the dual HMR watcher system
 */
export const setupDualHMR = async (): Promise<void> => {
  if (!isHMRAvailable() || !import.meta.hot) {
    console.log('HMR not available - skipping setup');
    return;
  }

  console.log('🔥 Setting up Dual HMR System... (test change v2)');
  console.log('📊 HMR Environment:', {
    'REPO_HMR': import.meta.env.VITE_REPO_HMR,
    'DEV': import.meta.env.DEV,
    'MODE': import.meta.env.MODE
  });

  // State preservation
  let hmrState: HMRState = (import.meta.hot.data?.hmrState as HMRState) || {};

  // Preserve state between HMR updates
  import.meta.hot.dispose(data => {
    data.hmrState = {
      ...hmrState,
      lastModelUpdate: new Date().toISOString()
    };
    console.log('💾 HMR: State preserved', data.hmrState);
  });

  // Restore state after update
  if (import.meta.hot.data?.hmrState) {
    hmrState = import.meta.hot.data.hmrState;
    console.log('🔄 HMR: State restored', hmrState);
  }

  // Initialize state from URL on startup
  await restoreStateFromURL();

  // === USER PROJECT WATCHER (Always Active) ===
  setupUserProjectWatcher(hmrState);

  // === MONOREPO WATCHER (Conditional) ===
  if (import.meta.env.VITE_REPO_HMR) {
    setupMonorepoWatcher();
  } else {
    console.log('📦 Monorepo HMR disabled (REPO_HMR=false)');
  }

  console.log('✅ Dual HMR System initialized');
};

/**
 * Setup user project watcher (always active)
 * Watches for changes in user model files
 */
function setupUserProjectWatcher(hmrState: HMRState): void {
  if (!import.meta.hot) return;

  console.log('👤 Setting up User Project Watcher...');

  // Watch for model file changes
  // Note: We use a more targeted approach than glob patterns for better performance
  const modelPatterns = [
    './main.ts',
    './main.js',
    './components/**/*.ts',
    './components/**/*.js'
  ];

  console.log('📁 Watching model patterns:', modelPatterns);

  // CRITICAL: Accept HMR for model files to prevent full page reload
  try {
    // Accept all model files for HMR
    import.meta.hot.accept(['./main.ts', './main.js'], () => {
      console.log('🔥 Main model file accepted for HMR');
    });

    // Try to accept component files (this might not work with glob patterns)
    // We'll handle this in the afterUpdate listener instead
    console.log('✅ HMR acceptance configured for main files');
  } catch (error) {
    console.warn('⚠️ Could not configure HMR acceptance:', error);
  }

  debugger;

  // Listen for ALL HMR events to debug what's happening
  import.meta.hot.on('vite:beforeUpdate', (data) => {
    console.log('🚨 BEFORE UPDATE (should fire before reload):', data);
    debugger; // This should fire BEFORE the page reload
  });

  // Listen for general HMR updates and filter for model files
  import.meta.hot.on('vite:afterUpdate', async (data) => {
    console.log('🔄 User Project HMR afterUpdate detected:', data);

    debugger;

    // Check if any updated files match our model patterns
    const updatedFiles = data?.updates?.map((u: any) => u.path) || [];
    console.log('📁 All updated files:', updatedFiles);

    const modelFileUpdated = updatedFiles.some((file: string) =>
      file.includes('/main.') ||
      file.includes('/components/') ||
      file.endsWith('main.ts') ||
      file.endsWith('main.js') ||
      file.includes('components')
    );

    if (modelFileUpdated) {
      console.log('📝 Model files updated:', updatedFiles.filter((f: string) =>
        f.includes('/main.') || f.includes('/components/') || f.includes('main.') || f.includes('components')
      ));

      await handleUserModelUpdate(hmrState);
    } else {
      console.log('📝 No model files in this update');
    }
  });

  console.log('✅ User Project Watcher active');
}

/**
 * Setup monorepo watcher (conditional - only when REPO_HMR=true)
 * Watches for changes in framework packages
 */
function setupMonorepoWatcher(): void {
  if (!import.meta.hot) return;

  console.log('🏗️ Setting up Monorepo Watcher...');

  // Listen for any HMR updates when in repo mode
  import.meta.hot.on('vite:afterUpdate', (data) => {
    console.log('🔄 Monorepo HMR afterUpdate detected:', data);

    debugger;

    // Check if this is a framework package change
    const updatedFiles = data?.updates?.map((u: any) => u.path) || [];
    console.log('🏗️ All updated files:', updatedFiles);

    const frameworkFileUpdated = updatedFiles.some((file: string) =>
      file.includes('/packages/wrapper/') ||
      file.includes('/packages/configurator/') ||
      file.includes('src/') // Any src file in the configurator package
    );

    if (frameworkFileUpdated) {
      console.log('🏗️ Framework files updated - triggering full reload');
      console.log('🏗️ Framework files:', updatedFiles.filter((f: string) =>
        f.includes('/packages/') || f.includes('src/')
      ));
      handleFrameworkUpdate();
    } else {
      console.log('🏗️ No framework files in this update');
    }
  });

  console.log('✅ Monorepo Watcher active');
}

/**
 * Handle user model file updates (granular refresh)
 */
async function handleUserModelUpdate(hmrState: HMRState): Promise<void> {
  try {
    console.log('🎯 Handling user model update...');

    // Preserve current UI state
    await preserveUIState(hmrState);

    // Clear model cache to force fresh reload
    const modelService = getModelService();
    modelService.clearCache();
    console.log('🗑️ Model cache cleared');

    // CRITICAL: Set cache-busting flag for dynamic imports
    (globalThis as any).__HMR_CACHE_BUST__ = true;
    console.log('🔄 Cache-busting enabled for dynamic imports');

    // Refresh the model registry (for dropdown updates)
    // But don't trigger URL initialization which might reset the current model
    await refreshAvailableModels();
    console.log('📋 Model registry refreshed');

    // If we're viewing a model that was updated, reload it with preserved state
    const modelToReload = hmrState.selectedModelId || currentModelId.value;
    if (modelToReload) {
      console.log(`🔄 Reloading model with state preservation: ${modelToReload}`);

      // CRITICAL: Add cache-busting timestamp to force fresh import
      const timestamp = Date.now();
      console.log(`🕐 Using cache-busting timestamp: ${timestamp}`);

      await reloadModelWithStatePreservation(modelToReload, hmrState);
    }

    console.log('✅ User model update complete');
  } catch (error) {
    console.error('❌ Error handling user model update:', error);
  }
}

/**
 * Handle framework package updates (full reload)
 */
function handleFrameworkUpdate(): void {
  console.log('🏗️ Framework packages changed - performing full reload');

  // For framework changes, we need a full page reload
  // because the core infrastructure may have changed
  window.location.reload();
}

/**
 * Reload a model while preserving viewer state (camera position, etc.)
 */
async function reloadModelWithStatePreservation(modelId: string, hmrState: HMRState): Promise<void> {
  try {
    console.log(`📷 Reloading model "${modelId}" with state preservation...`);

    // Load the model (this will generate new exports and update modelUrls)
    // The loadModel function will update the URL, but we'll override it in restoreUIState
    await loadModel(modelId);

    // Wait a bit for the model-viewer to start loading the new model
    await new Promise(resolve => setTimeout(resolve, 100));

    // Restore UI state after the model loads (this will ensure URL is correct)
    await restoreUIState(hmrState);

    console.log(`✅ Model "${modelId}" reloaded with state preserved`);
  } catch (error) {
    console.error(`❌ Error reloading model "${modelId}" with state preservation:`, error);
    throw error;
  }
}

/**
 * Preserve UI state before model updates
 */
async function preserveUIState(hmrState: HMRState): Promise<void> {
  try {
    // Preserve currently selected model
    hmrState.selectedModelId = currentModelId.value;
    console.log('📋 Selected model preserved:', hmrState.selectedModelId);

    // Preserve camera state from model-viewer
    const modelViewer = document.getElementById('viewer') as any;
    if (modelViewer) {
      // Try different methods to get camera state
      if (typeof modelViewer.getCameraOrbit === 'function') {
        hmrState.cameraOrbit = modelViewer.getCameraOrbit();
      } else if (modelViewer.cameraOrbit) {
        hmrState.cameraOrbit = modelViewer.cameraOrbit;
      }

      if (typeof modelViewer.getCameraTarget === 'function') {
        hmrState.cameraTarget = modelViewer.getCameraTarget();
      } else if (modelViewer.cameraTarget) {
        hmrState.cameraTarget = modelViewer.cameraTarget;
      }

      console.log('📷 Camera state preserved:', {
        orbit: hmrState.cameraOrbit,
        target: hmrState.cameraTarget
      });
    } else {
      console.warn('⚠️ Model viewer element not found for state preservation');
    }

    // Preserve state in URL
    await preserveStateInURL(hmrState);

    // TODO: Preserve parameter values from parametric controls
    // This would require integration with the parametric panel component

  } catch (error) {
    console.warn('⚠️ Could not preserve UI state:', error);
  }
}

/**
 * Restore UI state after model updates
 */
async function restoreUIState(hmrState: HMRState): Promise<void> {
  try {
    // Restore selected model from preserved state (don't use URL as it might be stale)
    if (hmrState.selectedModelId && hmrState.selectedModelId !== currentModelId.value) {
      console.log(`📋 Restoring selected model from HMR state: ${hmrState.selectedModelId}`);
      // Update the currentModelId signal and URL
      currentModelId.value = hmrState.selectedModelId;

      // Make sure URL reflects the correct model
      const url = new URL(window.location.href);
      url.searchParams.set('model', hmrState.selectedModelId);
      window.history.replaceState({}, '', url.toString());
      console.log('🔗 URL updated during HMR restore:', hmrState.selectedModelId);
    }

    // Restore camera state
    if (hmrState.cameraOrbit || hmrState.cameraTarget) {
      const modelViewer = document.getElementById('viewer') as any;
      if (modelViewer) {
        console.log('📷 Attempting to restore camera state:', {
          orbit: hmrState.cameraOrbit,
          target: hmrState.cameraTarget
        });

        // Wait for the model to be loaded before restoring state
        const waitForModelLoad = () => {
          return new Promise<void>((resolve) => {
            if (modelViewer.loaded) {
              resolve();
            } else {
              const onLoad = () => {
                modelViewer.removeEventListener('load', onLoad);
                resolve();
              };
              modelViewer.addEventListener('load', onLoad);

              // Fallback timeout
              setTimeout(resolve, 2000);
            }
          });
        };

        await waitForModelLoad();

        // Restore camera state using different methods
        if (hmrState.cameraOrbit) {
          if (typeof modelViewer.setCameraOrbit === 'function') {
            modelViewer.setCameraOrbit(hmrState.cameraOrbit);
          } else {
            modelViewer.cameraOrbit = hmrState.cameraOrbit;
          }
        }

        if (hmrState.cameraTarget) {
          if (typeof modelViewer.setCameraTarget === 'function') {
            modelViewer.setCameraTarget(hmrState.cameraTarget);
          } else {
            modelViewer.cameraTarget = hmrState.cameraTarget;
          }
        }

        console.log('✅ Camera state restored successfully');
      } else {
        console.warn('⚠️ Model viewer element not found for state restoration');
      }
    }

    // TODO: Restore parameter values

  } catch (error) {
    console.warn('⚠️ Could not restore UI state:', error);
  }
}

/**
 * Preserve state in URL parameters
 */
async function preserveStateInURL(hmrState: HMRState): Promise<void> {
  try {
    const url = new URL(window.location.href);

    // Preserve selected model
    if (hmrState.selectedModelId) {
      url.searchParams.set('model', hmrState.selectedModelId);
    }

    // Preserve camera state
    if (hmrState.cameraOrbit) {
      url.searchParams.set('orbit', hmrState.cameraOrbit);
    }
    if (hmrState.cameraTarget) {
      url.searchParams.set('target', hmrState.cameraTarget);
    }

    // Update URL without triggering navigation
    window.history.replaceState({}, '', url.toString());
    console.log('🔗 State preserved in URL:', url.search);

  } catch (error) {
    console.warn('⚠️ Could not preserve state in URL:', error);
  }
}

/**
 * Restore state from URL parameters
 */
async function restoreStateFromURL(): Promise<void> {
  try {
    const url = new URL(window.location.href);

    // Restore selected model
    const modelParam = url.searchParams.get('model');
    if (modelParam && modelParam !== currentModelId.value) {
      console.log(`🔗 Restoring model from URL: ${modelParam}`);
      currentModelId.value = modelParam;
    }

    // Restore camera state
    const orbitParam = url.searchParams.get('orbit');
    const targetParam = url.searchParams.get('target');

    if (orbitParam || targetParam) {
      const modelViewer = document.getElementById('viewer') as any;
      if (modelViewer) {
        // Wait a bit for model to load
        setTimeout(() => {
          if (orbitParam) {
            if (typeof modelViewer.setCameraOrbit === 'function') {
              modelViewer.setCameraOrbit(orbitParam);
            } else {
              modelViewer.cameraOrbit = orbitParam;
            }
          }
          if (targetParam) {
            if (typeof modelViewer.setCameraTarget === 'function') {
              modelViewer.setCameraTarget(targetParam);
            } else {
              modelViewer.cameraTarget = targetParam;
            }
          }
          console.log('🔗 Camera state restored from URL');
        }, 500);
      }
    }

  } catch (error) {
    console.warn('⚠️ Could not restore state from URL:', error);
  }
}
