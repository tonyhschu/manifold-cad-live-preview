/**
 * Application State Store
 * 
 * Central state management using Preact Signals.
 * This store handles all application state and provides actions for state changes.
 */

import { signal, computed } from '@preact/signals';
import { getAvailableModels, loadModelById, ModelMetadata } from '../core/model-loader';
import { exportToOBJ, createModelUrl } from '../lib/export';
import { manifoldToGLB, createGLBUrl } from '../lib/gltf-export';
import { StatusState, ModelUrlsState } from './types';

// ===== Application State Signals =====

/**
 * Current model ID
 */
export const currentModelId = signal('demo');

/**
 * Status message and error state
 */
export const status = signal<StatusState>({ 
  message: 'Initializing...', 
  isError: false 
});

/**
 * Model download URLs
 */
export const modelUrls = signal<ModelUrlsState>({ 
  objUrl: '', 
  glbUrl: '' 
});

/**
 * Current model metadata
 */
export const modelMetadata = signal<ModelMetadata | null>(null);

/**
 * The currently loaded model object
 */
export const currentModel = signal<any | null>(null);

/**
 * Available models that can be loaded
 */
export const availableModels = signal(getAvailableModels());

// ===== Computed Values =====

/**
 * Whether a model is currently loading
 */
export const isModelLoading = computed(() => 
  status.value.message.includes('Loading') || 
  status.value.message.includes('Exporting')
);

/**
 * Whether a model is currently loaded
 */
export const isModelLoaded = computed(() => 
  currentModel.value !== null && 
  modelUrls.value.objUrl !== '' &&
  modelUrls.value.glbUrl !== ''
);

// ===== Actions =====

/**
 * Load a model by ID
 * 
 * This action handles the complete model loading process:
 * 1. Load the model from the model loader
 * 2. Export to OBJ and GLB formats
 * 3. Update all relevant state signals
 * 4. Update the model-viewer element
 */
export async function loadModel(modelId: string) {
  try {
    // Update current model ID
    currentModelId.value = modelId;
    
    // Update status
    status.value = { 
      message: `Loading model: ${modelId}...`, 
      isError: false 
    };
    
    // Load the model
    const { model, metadata } = await loadModelById(modelId);
    
    // Update model and metadata
    modelMetadata.value = metadata || null;
    currentModel.value = model;
    
    // Export model to OBJ
    status.value = { 
      message: 'Exporting model to OBJ and GLB...', 
      isError: false 
    };
    
    const objBlob = exportToOBJ(model);
    const objUrl = createModelUrl(objBlob);
    
    // Export to GLB
    status.value = { 
      message: 'Generating GLB for model-viewer...', 
      isError: false 
    };
    
    const glbBlob = await manifoldToGLB(model);
    const glbUrl = createGLBUrl(glbBlob);
    
    // Update URLs
    modelUrls.value = { objUrl, glbUrl };
    
    // We already set the metadata above, so no need to update it again
    
    // Update final status
    status.value = { 
      message: 'Model loaded successfully', 
      isError: false 
    };
    
    return model;
  } catch (error: any) {
    // Handle errors
    status.value = { 
      message: `Error: ${error.message}`, 
      isError: true 
    };
    
    throw error;
  }
}

/**
 * Update the status message
 */
export function updateStatus(message: string, isError = false) {
  status.value = { message, isError };
}

/**
 * Refresh the available models list
 */
export function refreshAvailableModels() {
  availableModels.value = getAvailableModels();
}