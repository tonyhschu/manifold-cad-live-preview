/**
 * V3 State Bridge
 * 
 * Bridges the V3 UIStateManager with Preact signals for UI components.
 * This allows UI components to use reactive signals while the underlying
 * state is managed by the V3 UIStateManager.
 */

import { signal, computed } from '@preact/signals';
import type { UIStateManager } from './ui-state';
import { getModelService } from '../services';

// Global V3 state bridge instance
let v3StateBridge: V3StateBridge | null = null;

/**
 * V3 State Bridge
 * 
 * Creates reactive signals from V3 UIStateManager state.
 * UI components can subscribe to these signals instead of the legacy store.
 */
export class V3StateBridge {
  private uiStateManager: UIStateManager | null = null;
  
  // Reactive signals for UI components
  public readonly isInitialized = signal<boolean>(false);
  public readonly selectedModel = signal<string | null>(null);
  public readonly availableModels = signal<Array<{id: string; name: string; type: 'static' | 'parametric'}>>([]);
  public readonly modelParameters = signal<Record<string, any>>({});
  public readonly modelUrls = signal<{objUrl: string; glbUrl: string}>({ objUrl: '', glbUrl: '' });
  public readonly modelMetadata = signal<any>(null);
  public readonly parametricConfig = signal<any>(null);
  public readonly status = signal<{message: string; isError: boolean}>({
    message: 'Initializing V3 system...',
    isError: false
  });

  constructor() {
    // Don't initialize immediately - wait for explicit initialization
    console.log('🔄 V3 State Bridge created, waiting for initialization...');
  }

  /**
   * Initialize the bridge from the model service
   * This should be called after the ModelService is registered
   */
  async initialize(): Promise<void> {
    let retryCount = 0;
    const maxRetries = 5;

    while (retryCount < maxRetries) {
      try {
        const modelService = getModelService();
        if (modelService && typeof modelService.getUIStateManager === 'function') {
          this.uiStateManager = modelService.getUIStateManager();
          this.setupStateSync();
          this.isInitialized.value = true;
          console.log('✅ V3 State Bridge initialized with UIStateManager');
          return;
        } else {
          throw new Error('ModelService not available or missing getUIStateManager method');
        }
      } catch (error) {
        retryCount++;
        console.warn(`⚠️ V3 State Bridge initialization attempt ${retryCount}/${maxRetries} failed:`, error);

        if (retryCount >= maxRetries) {
          console.error('❌ V3 State Bridge failed to initialize after maximum retries');
          return;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  /**
   * Set up bidirectional state synchronization
   */
  private setupStateSync(): void {
    if (!this.uiStateManager) return;

    // Sync initial state from UIStateManager to signals
    const initialState = this.uiStateManager.getState();
    this.selectedModel.value = initialState.selectedModel;
    this.modelParameters.value = initialState.parameters;

    // If there's a selected model from URL/localStorage, load it automatically
    if (initialState.selectedModel) {
      console.log('🔄 V3 Bridge: Auto-loading model from initial state:', initialState.selectedModel);
      this.loadModel(initialState.selectedModel, initialState.parameters).catch(error => {
        console.error('❌ Failed to auto-load model from initial state:', error);
        this.status.value = { message: `Failed to load model: ${error.message}`, isError: true };
      });
    }

    // Listen to UIStateManager changes and update signals
    this.uiStateManager.addListener((state) => {
      console.log('🔄 V3 Bridge: UIStateManager state changed:', state);
      this.selectedModel.value = state.selectedModel;
      this.modelParameters.value = state.parameters;
    });

    // Update available models from model service
    this.updateAvailableModels();
  }

  /**
   * Update available models from the model service
   */
  private updateAvailableModels(): void {
    try {
      const modelService = getModelService();
      if (modelService && typeof modelService.getAvailableModels === 'function') {
        const models = modelService.getAvailableModels();
        this.availableModels.value = models;
        console.log('✅ V3 Bridge: Available models updated:', models.map(m => m.id));
      }
    } catch (error) {
      console.warn('⚠️ Failed to update available models in V3 bridge:', error);
    }
  }

  /**
   * Update model URLs and metadata from the model load result
   */
  private updateModelDataFromResult(modelResult: any): void {
    try {
      // Update model URLs from the exports
      if (modelResult.exports) {
        this.modelUrls.value = {
          objUrl: modelResult.exports.objUrl || '',
          glbUrl: modelResult.exports.glbUrl || ''
        };
        console.log('✅ V3 Bridge: Updated model URLs:', this.modelUrls.value);
      }

      // Update model metadata
      if (modelResult.metadata) {
        this.modelMetadata.value = modelResult.metadata;
        console.log('✅ V3 Bridge: Updated model metadata:', this.modelMetadata.value);
      }

      // Update parametric config for parametric models
      if (modelResult.isParametric && modelResult.config) {
        this.parametricConfig.value = modelResult.config;
        console.log('✅ V3 Bridge: Updated parametric config:', this.parametricConfig.value);
      } else {
        // Clear parametric config for static models
        this.parametricConfig.value = null;
        console.log('✅ V3 Bridge: Cleared parametric config (static model)');
      }
    } catch (error) {
      console.warn('⚠️ Failed to update model data from result in V3 bridge:', error);
    }
  }

  /**
   * Load a model (delegates to V3 system)
   */
  async loadModel(modelId: string, parameters: Record<string, any> = {}): Promise<void> {
    try {
      this.status.value = { message: `Loading model: ${modelId}...`, isError: false };
      
      const modelService = getModelService();
      if (!modelService) {
        throw new Error('Model service not available');
      }

      // Load model through V3 system
      const modelResult = await modelService.loadModel(modelId, parameters);

      // Update UIStateManager (which will trigger signal updates)
      if (this.uiStateManager) {
        this.uiStateManager.selectModel(modelId, parameters);
      }

      // Update model URLs and metadata from the load result
      this.updateModelDataFromResult(modelResult);

      this.status.value = { message: 'Model loaded successfully', isError: false };
      console.log('✅ V3 Bridge: Model loaded:', modelId);
      
    } catch (error: any) {
      const errorMessage = `Error loading model: ${error.message}`;
      this.status.value = { message: errorMessage, isError: true };
      console.error('❌ V3 Bridge: Failed to load model:', error);
      throw error;
    }
  }

  /**
   * Refresh available models
   */
  async refreshAvailableModels(): Promise<void> {
    // Force refresh the model service cache if it supports it
    try {
      const modelService = getModelService();
      if (modelService && typeof modelService.refreshAvailableModels === 'function') {
        modelService.refreshAvailableModels();
      }
    } catch (error) {
      console.warn('⚠️ Failed to refresh model service cache:', error);
    }

    // Update our local signals
    this.updateAvailableModels();
  }

  /**
   * Get the UIStateManager instance
   */
  getUIStateManager(): UIStateManager | null {
    return this.uiStateManager;
  }

  /**
   * Update status message
   */
  updateStatus(message: string, isError: boolean = false): void {
    this.status.value = { message, isError };
  }
}

/**
 * Get or create the global V3 state bridge instance
 */
export function getV3StateBridge(): V3StateBridge {
  if (!v3StateBridge) {
    v3StateBridge = new V3StateBridge();
  }
  return v3StateBridge;
}

/**
 * Check if the V3 state bridge is initialized
 */
export function isV3StateBridgeInitialized(): boolean {
  return v3StateBridge !== null && v3StateBridge.getUIStateManager() !== null;
}

/**
 * Initialize the V3 state bridge
 * Should be called during application startup after ModelService is registered
 */
export async function initializeV3StateBridge(): Promise<V3StateBridge> {
  const bridge = getV3StateBridge();
  await bridge.initialize();
  return bridge;
}

// Export signals for direct use by UI components
export const v3Signals = {
  get isInitialized() { return getV3StateBridge().isInitialized; },
  get selectedModel() { return getV3StateBridge().selectedModel; },
  get availableModels() { return getV3StateBridge().availableModels; },
  get modelParameters() { return getV3StateBridge().modelParameters; },
  get modelUrls() { return getV3StateBridge().modelUrls; },
  get modelMetadata() { return getV3StateBridge().modelMetadata; },
  get parametricConfig() { return getV3StateBridge().parametricConfig; },
  get status() { return getV3StateBridge().status; },
};

// Export actions for UI components
export const v3Actions = {
  loadModel: (modelId: string, parameters?: Record<string, any>) => 
    getV3StateBridge().loadModel(modelId, parameters),
  refreshAvailableModels: () => 
    getV3StateBridge().refreshAvailableModels(),
  updateStatus: (message: string, isError?: boolean) => 
    getV3StateBridge().updateStatus(message, isError),
};
