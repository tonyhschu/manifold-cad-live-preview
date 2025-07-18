/**
 * Application State Store (DEPRECATED)
 *
 * Central state management using Preact Signals.
 * This store handles ONLY state management - business logic is delegated to services.
 *
 * @deprecated This legacy store is deprecated. Use V3 state management system (v3-bridge.ts) instead.
 * The V3 system provides better state persistence, URL synchronization, and reactive updates.
 */

import { signal, computed } from '@preact/signals';
import { ModelMetadata } from '../core/model-loader';
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

    // Load model with progress tracking (params optional, defaults to {})
    const result = await modelService.loadModel(modelId, {}, (progress, message) => {
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

    // Note: URL management is now handled by V3 UIStateManager

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
 * Interface for manifest.json structure
 */
interface TempManifestData {
  models: Array<{
    id: string;
    name: string;
    type: 'static' | 'parametric';
    filePath: string;
    blobPath?: string;
    lastUpdated: string;
    status: 'pending' | 'compiling' | 'compiled' | 'error';
    error?: string;
    blobSize?: number;
    compilationTime?: number;
  }>;
  lastBuild: string;
  buildCount: number;
}

/**
 * Try to read models from temp/manifest.json
 */
async function getModelsFromTempFolder(): Promise<{ id: string; name: string; type: 'static' | 'parametric' }[] | null> {
  try {
    const manifestPath = './temp/manifest.json';
    const response = await fetch(manifestPath);

    if (!response.ok) {
      console.log('📂 No temp/manifest.json found, falling back to discovery');
      return null;
    }

    const manifestContent = await response.text();
    const manifest: TempManifestData = JSON.parse(manifestContent);

    // Filter to only compiled models
    const compiledModels = manifest.models
      .filter(model => model.status === 'compiled')
      .map(model => ({
        id: model.id,
        name: model.name,
        type: model.type
      }));

    console.log('📋 Loaded models from temp folder:', {
      total: manifest.models.length,
      compiled: compiledModels.length,
      buildCount: manifest.buildCount,
      models: compiledModels.map(m => `${m.id} (${m.type})`)
    });

    return compiledModels;

  } catch (error) {
    console.log('📂 Error reading temp/manifest.json:', error);
    return null;
  }
}

/**
 * Refresh the available models list
 * Uses model service if available (V3), otherwise reads from temp/manifest.json (V1/V2)
 */
export async function refreshAvailableModels() {
  try {
    // Try to use model service first (V3 approach)
    try {
      const modelService = getModelService();
      if (modelService && typeof modelService.getAvailableModels === 'function') {
        const models = modelService.getAvailableModels();
        if (models && models.length > 0) {
          availableModels.value = models;
          console.log('✅ Available models refreshed from model service (V3):', models.map(m => m.id));
          return;
        }
      }
    } catch (serviceError) {
      console.log('📂 Model service not available, falling back to temp folder approach');
    }

    // Fallback: Read from temp folder (V1/V2 approach)
    const tempModels = await getModelsFromTempFolder();

    if (tempModels && tempModels.length > 0) {
      // Use models from temp folder
      availableModels.value = tempModels;
      console.log('✅ Available models refreshed from temp folder:', tempModels.map(m => m.id));
      return;
    }

    // No models found - show helpful message
    console.log('📂 No compiled models found in temp folder');
    availableModels.value = [];
    updateStatus('No models found. Run "npm run dev:models" to compile your models.', true);

  } catch (error) {
    console.error('❌ Failed to refresh available models:', error);
    availableModels.value = [];
    updateStatus('Error loading models. Run "npm run dev:models" to compile your models.', true);
  }
}
