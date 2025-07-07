/**
 * V3 Configurator Component
 *
 * Simple configurator that demonstrates the complete V3 architecture:
 * - Pipeline loading and reloading
 * - State preservation across pipeline updates
 * - Selective re-rendering (only model viewer updates)
 */

import { createV3ModelService } from '../services/V3ModelService.js';
import type { UIState } from '../state/ui-state.js';

/**
 * V3 Configurator Class
 * 
 * This is a simple implementation that demonstrates the V3 architecture.
 * In a real application, this would integrate with your UI framework (React, Vue, etc.)
 */
export class V3Configurator {
  private modelService: any;
  private container: HTMLElement;
  private currentModel: any = null;
  private isInitialized = false;

  constructor(container: HTMLElement, pipelinePath?: string) {
    this.container = container;
    this.modelService = createV3ModelService(pipelinePath);
    this.setupUI();
    this.initialize();
  }

  /**
   * Initialize the configurator
   */
  private async initialize(): Promise<void> {
    console.log('🚀 Initializing V3 Configurator...');

    try {
      // Initialize model service
      await this.modelService.initialize();

      // Setup pipeline change listener
      this.modelService.onPipelineChange(() => {
        console.log('🔄 Pipeline changed, updating UI...');
        this.handlePipelineUpdate();
      });

      // Setup UI state listener
      this.modelService.getUIStateManager().addListener((state) => {
        this.handleStateChange(state);
      });

      // Load initial model if specified in state
      const uiState = this.modelService.getUIState();
      if (uiState.selectedModel) {
        await this.loadModel(uiState.selectedModel, uiState.parameters);
      }

      this.isInitialized = true;
      console.log('✅ V3 Configurator initialized');

    } catch (error) {
      console.error('❌ Failed to initialize V3 Configurator:', error);
      this.showError('Failed to initialize configurator');
    }
  }

  /**
   * Setup basic UI structure
   */
  private setupUI(): void {
    this.container.innerHTML = `
      <div class="v3-configurator">
        <div class="header">
          <h1>V3 Configurator</h1>
          <div class="status">
            <span id="pipeline-status">⏳ Loading...</span>
            <button id="refresh-btn">🔄 Refresh</button>
          </div>
        </div>
        
        <div class="content">
          <div class="sidebar">
            <div class="panel">
              <h3>Models</h3>
              <div id="model-list">Loading models...</div>
            </div>
            
            <div class="panel">
              <h3>Parameters</h3>
              <div id="parameters">Select a parametric model</div>
            </div>
          </div>
          
          <div class="viewer">
            <div id="model-viewer">
              <div class="placeholder">
                <p>🎯 Select a model to view</p>
                <p>Pipeline will auto-reload when you make changes</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <div id="pipeline-info">Pipeline info will appear here</div>
        </div>
      </div>
    `;

    // Add basic styles
    this.addStyles();

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Add basic CSS styles
   */
  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .v3-configurator {
        font-family: system-ui, sans-serif;
        height: 100vh;
        display: flex;
        flex-direction: column;
      }
      
      .header {
        background: #f5f5f5;
        padding: 1rem;
        border-bottom: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .content {
        flex: 1;
        display: flex;
      }
      
      .sidebar {
        width: 300px;
        background: #fafafa;
        border-right: 1px solid #ddd;
        padding: 1rem;
        overflow-y: auto;
      }
      
      .panel {
        margin-bottom: 2rem;
      }
      
      .panel h3 {
        margin: 0 0 1rem 0;
        color: #333;
      }
      
      .viewer {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fff;
      }
      
      .placeholder {
        text-align: center;
        color: #666;
      }
      
      .footer {
        background: #f5f5f5;
        padding: 0.5rem 1rem;
        border-top: 1px solid #ddd;
        font-size: 0.9em;
        color: #666;
      }
      
      .model-item {
        padding: 0.5rem;
        margin: 0.25rem 0;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .model-item:hover {
        background: #f0f0f0;
      }
      
      .model-item.selected {
        background: #e3f2fd;
        border-color: #2196f3;
      }
      
      .parameter-item {
        margin: 0.5rem 0;
      }
      
      .parameter-item label {
        display: block;
        margin-bottom: 0.25rem;
        font-weight: 500;
      }
      
      .parameter-item input {
        width: 100%;
        padding: 0.25rem;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      
      button {
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
      }
      
      button:hover {
        background: #f0f0f0;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Refresh button
    const refreshBtn = this.container.querySelector('#refresh-btn');
    refreshBtn?.addEventListener('click', () => {
      this.handleRefresh();
    });
  }

  /**
   * Handle pipeline updates
   */
  private async handlePipelineUpdate(): Promise<void> {
    console.log('🔄 Handling pipeline update...');

    // Update model list
    this.updateModelList();

    // Update pipeline info
    this.updatePipelineInfo();

    // Reload current model if any
    const uiState = this.modelService.getUIState();
    if (uiState.selectedModel) {
      try {
        await this.loadModel(uiState.selectedModel, uiState.parameters);
        console.log('✅ Current model reloaded after pipeline update');
      } catch (error) {
        console.warn('⚠️ Failed to reload current model after pipeline update:', error);
        this.showError('Model no longer available after pipeline update');
      }
    }

    // Update status
    this.updateStatus('✅ Pipeline updated');
  }

  /**
   * Handle UI state changes
   */
  private handleStateChange(state: UIState): void {
    console.log('🔄 UI state changed:', state);
    // In a real implementation, this would update the UI to reflect state changes
  }

  /**
   * Update model list
   */
  private updateModelList(): void {
    const modelListEl = this.container.querySelector('#model-list');
    if (!modelListEl) return;

    const models = this.modelService.getAvailableModels();
    const uiState = this.modelService.getUIState();

    if (models.length === 0) {
      modelListEl.innerHTML = '<p>No models available</p>';
      return;
    }

    modelListEl.innerHTML = models.map(model => `
      <div class="model-item ${model.id === uiState.selectedModel ? 'selected' : ''}" 
           data-model-id="${model.id}">
        <strong>${model.name}</strong>
        <br>
        <small>${model.type}</small>
      </div>
    `).join('');

    // Add click handlers
    modelListEl.querySelectorAll('.model-item').forEach(item => {
      item.addEventListener('click', () => {
        const modelId = item.getAttribute('data-model-id');
        if (modelId) {
          this.selectModel(modelId);
        }
      });
    });
  }

  /**
   * Update pipeline info
   */
  private updatePipelineInfo(): void {
    const infoEl = this.container.querySelector('#pipeline-info');
    if (!infoEl) return;

    const pipelineInfo = this.modelService.getPipelineInfo();
    if (pipelineInfo) {
      infoEl.textContent = `Pipeline: ${pipelineInfo.modelCount} models, version ${pipelineInfo.version}`;
    } else {
      infoEl.textContent = 'Pipeline not available';
    }
  }

  /**
   * Update status
   */
  private updateStatus(message: string): void {
    const statusEl = this.container.querySelector('#pipeline-status');
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  /**
   * Select a model
   */
  private async selectModel(modelId: string): Promise<void> {
    console.log(`🎯 Selecting model: ${modelId}`);

    try {
      // Get default parameters for parametric models
      let params = {};
      if (this.modelService.isParametric(modelId)) {
        const config = this.modelService.getParameterConfig(modelId);
        if (config && config.parameters) {
          // Extract default values
          for (const [key, paramConfig] of Object.entries(config.parameters)) {
            params[key] = (paramConfig as any).value;
          }
        }
      }

      await this.loadModel(modelId, params);
      this.updateModelList(); // Refresh selection
      this.updateParameterPanel(modelId);

    } catch (error) {
      console.error(`❌ Failed to select model ${modelId}:`, error);
      this.showError(`Failed to load model: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Load a model
   */
  private async loadModel(modelId: string, params: any = {}): Promise<void> {
    console.log(`🔨 Loading model: ${modelId}`, params);

    try {
      const result = await this.modelService.loadModel(modelId, params, (progress, message) => {
        this.updateStatus(`${Math.round(progress)}% - ${message}`);
      });

      this.currentModel = result.model;
      this.updateModelViewer(result);
      this.updateStatus(`✅ Loaded: ${result.metadata?.name || modelId}`);

    } catch (error) {
      console.error(`❌ Failed to load model ${modelId}:`, error);
      this.showError(`Failed to load model: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Update model viewer (placeholder implementation)
   */
  private updateModelViewer(result: any): void {
    const viewerEl = this.container.querySelector('#model-viewer');
    if (!viewerEl) return;

    // In a real implementation, this would render the 3D model
    viewerEl.innerHTML = `
      <div class="model-display">
        <h3>✅ Model Loaded</h3>
        <p><strong>Name:</strong> ${result.metadata?.name || 'Unknown'}</p>
        <p><strong>Type:</strong> ${result.isParametric ? 'Parametric' : 'Static'}</p>
        <p><strong>Model Object:</strong> ${typeof result.model}</p>
        <p><em>3D viewer would render here</em></p>
      </div>
    `;
  }

  /**
   * Update parameter panel
   */
  private updateParameterPanel(modelId: string): void {
    const panelEl = this.container.querySelector('#parameters');
    if (!panelEl) return;

    if (!this.modelService.isParametric(modelId)) {
      panelEl.innerHTML = '<p>Static model - no parameters</p>';
      return;
    }

    const config = this.modelService.getParameterConfig(modelId);
    if (!config || !config.parameters) {
      panelEl.innerHTML = '<p>No parameter configuration</p>';
      return;
    }

    // Generate parameter controls (simplified)
    const parameterHtml = Object.entries(config.parameters).map(([key, paramConfig]: [string, any]) => `
      <div class="parameter-item">
        <label>${key}</label>
        <input type="number" 
               value="${paramConfig.value}" 
               min="${paramConfig.min || ''}" 
               max="${paramConfig.max || ''}"
               data-param="${key}">
      </div>
    `).join('');

    panelEl.innerHTML = parameterHtml + '<button id="update-model">Update Model</button>';

    // Add update handler
    const updateBtn = panelEl.querySelector('#update-model');
    updateBtn?.addEventListener('click', () => {
      this.updateModelWithParameters(modelId);
    });
  }

  /**
   * Update model with new parameters
   */
  private async updateModelWithParameters(modelId: string): Promise<void> {
    const panelEl = this.container.querySelector('#parameters');
    if (!panelEl) return;

    // Collect parameter values
    const params: any = {};
    panelEl.querySelectorAll('input[data-param]').forEach((input: any) => {
      const paramName = input.getAttribute('data-param');
      params[paramName] = parseFloat(input.value) || input.value;
    });

    await this.loadModel(modelId, params);
  }

  /**
   * Handle refresh button
   */
  private async handleRefresh(): Promise<void> {
    console.log('🔄 Manual refresh requested');
    this.updateStatus('🔄 Refreshing models...');

    // In V3, refresh is handled by HMR events, so we just refresh the model list
    this.refreshModelList();
    this.updateStatus('✅ Models refreshed');
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.updateStatus(`❌ ${message}`);
    console.error(message);
  }

  /**
   * Start the configurator
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Update initial UI
    this.updateModelList();
    this.updatePipelineInfo();
    this.updateStatus('✅ Ready');
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.modelService.destroy();
  }
}

/**
 * Factory function to create V3 configurator
 */
export function createV3Configurator(container: HTMLElement, pipelinePath?: string): V3Configurator {
  return new V3Configurator(container, pipelinePath);
}
