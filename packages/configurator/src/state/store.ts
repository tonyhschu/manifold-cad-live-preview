/**
 * Application State Store
 *
 * Central state management using Preact Signals.
 * This store handles ONLY state management - business logic is delegated to services.
 */

import { signal, computed } from '@preact/signals';
import { ModelMetadata, getAvailableModels as getAvailableModelsFromLoader, getAvailableModelsAsync, setupModelDiscoveryHMR } from '../core/model-loader';
import { getModelService } from '../services';
import { StatusState, ModelUrlsState } from './types';
import type { ParametricConfig } from '@manifold-studio/wrapper';

// ===== Application State Signals =====

/**
 * Current model ID
 */
export const currentModelId = signal('main');

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
 * Whether the current model is parametric
 */
export const isModelParametric = signal<boolean>(false);

/**
 * Current parametric model configuration (if applicable)
 */
export const currentParametricConfig = signal<ParametricConfig | null>(null);

/**
 * Available models that can be loaded
 */
export const availableModels = signal<Array<{id: string; name: string; type: 'static' | 'parametric'}>>([]);

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
    isModelParametric.value = result.isParametric || false;
    currentParametricConfig.value = result.config || null;
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
 * Update the current model (e.g., from parametric changes)
 */
export function updateModel(model: any) {
  currentModel.value = model;
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
export async function refreshAvailableModels() {
  try {
    const models = await getAvailableModelsAsync();
    availableModels.value = models.map(({ id, name, type }) => ({ id, name, type }));
  } catch (error) {
    console.error('Failed to refresh available models:', error);
  }
}

/**
 * Initialize the store with available models
 */
export async function initializeStore() {
  // Load available models asynchronously
  await refreshAvailableModels();

  // Set up HMR for model discovery
  setupModelDiscoveryHMR(() => {
    // Refresh the model list when HMR detects changes
    refreshAvailableModels().catch(error => {
      console.error('Failed to refresh models after HMR update:', error);
    });
  });
}