/**
 * Application State Store
 * 
 * Central state management using Preact Signals.
 * This store handles ONLY state management - business logic is delegated to services.
 */

import { signal, computed } from '@preact/signals';
import { ModelMetadata, getAvailableModels as getAvailableModelsFromLoader } from '../core/model-loader';
import { getModelService } from '../services';
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
export const availableModels = signal(getAvailableModelsFromLoader());

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
 * Load a model by ID using the ModelService
 * 
 * This action delegates to the ModelService and updates state based on results.
 */
export async function loadModel(modelId: string) {
  try {
    // Update current model ID immediately
    currentModelId.value = modelId;
    
    // Get the model service
    const modelService = getModelService();
    
    // Load model with progress tracking
    const result = await modelService.loadModel(modelId, (progress, message) => {
      status.value = {
        message: message || `Loading model: ${modelId}... (${Math.round(progress)}%)`,
        isError: false
      };
    });
    
    // Update all state from service result
    currentModel.value = result.model;
    modelMetadata.value = result.metadata || null;
    modelUrls.value = {
      objUrl: result.exports.objUrl,
      glbUrl: result.exports.glbUrl
    };
    
    // Update final status
    status.value = {
      message: 'Model loaded successfully',
      isError: false
    };
    
    return result.model;
    
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
  // Use the model loader directly since it doesn't need services
  availableModels.value = getAvailableModelsFromLoader();
}

/**
 * Initialize the store with available models
 */
export function initializeStore() {
  // No-op now since availableModels is initialized directly
  // This function is kept for potential future initialization needs
}