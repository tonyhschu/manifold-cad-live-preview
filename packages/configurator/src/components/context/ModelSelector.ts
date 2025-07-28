/**
 * ModelSelector Web Component
 *
 * Provides a dropdown for selecting different models.
 * Uses the Light DOM approach (no Shadow DOM).
 *
 * Updated to use V3 state management system.
 */

import { v3Signals, v3Actions } from '../../state/v3-bridge';

export class ModelSelector extends HTMLElement {
  private containerElement: HTMLElement | null = null;
  private selectElement: HTMLSelectElement | null = null;
  private unsubscribeModelId: (() => void) | null = null;
  private unsubscribeAvailableModels: (() => void) | null = null;
  
  constructor() {
    super();
  }

  connectedCallback() {
    // Create container if needed
    this.containerElement = this.querySelector('.model-selector') ||
                           this.createContainerElement();

    // Wait for V3 bridge to be initialized before setting up subscriptions
    if (v3Signals.isInitialized.value) {
      this.setupSubscriptions();
    } else {
      // Subscribe to initialization signal
      const initUnsubscribe = v3Signals.isInitialized.subscribe(isInitialized => {
        if (isInitialized) {
          this.setupSubscriptions();
          initUnsubscribe(); // Unsubscribe from init signal
        }
      });
    }
  }

  private setupSubscriptions() {
    // Subscribe to V3 selectedModel signal to update selection
    this.unsubscribeModelId = v3Signals.selectedModel.subscribe(modelId => {
      if (this.selectElement && this.selectElement.value !== modelId) {
        this.selectElement.value = modelId || '';
      }
    });

    // Subscribe to V3 availableModels signal to re-render when models change
    this.unsubscribeAvailableModels = v3Signals.availableModels.subscribe(() => {
      this.renderModelSelector();
    });

    // Initial render
    this.renderModelSelector();
  }
  
  disconnectedCallback() {
    
    // Clean up subscriptions when element is removed
    if (this.unsubscribeModelId) {
      this.unsubscribeModelId();
      this.unsubscribeModelId = null;
    }
    
    if (this.unsubscribeAvailableModels) {
      this.unsubscribeAvailableModels();
      this.unsubscribeAvailableModels = null;
    }
  }
  
  /**
   * Create the container element if it doesn't exist
   */
  private createContainerElement() {
    const container = document.createElement('div');
    container.className = 'model-selector';
    this.appendChild(container);
    return container;
  }
  
  /**
   * Render the model selector dropdown
   */
  private renderModelSelector() {
    if (!this.containerElement) return;



    // Clear existing content
    this.containerElement.innerHTML = '';

    // Create label
    const label = document.createElement('label');
    label.textContent = 'Model';
    label.htmlFor = 'model-select';
    this.containerElement.appendChild(label);

    // Create select element with semantic attributes
    const select = document.createElement('select');
    select.id = 'model-select';
    select.setAttribute('aria-label', 'Select a 3D model to view and configure');
    select.setAttribute('role', 'combobox');

    // Add options for each available model from V3 system
    v3Signals.availableModels.value.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.name;
      select.appendChild(option);
    });

    // Set initial selection from V3 system
    const selectedModel = v3Signals.selectedModel.value;
    select.value = selectedModel || '';

    // Add change handler using V3 actions
    select.addEventListener('change', async (e) => {
      const modelId = (e.target as HTMLSelectElement).value;
      try {
        await v3Actions.loadModel(modelId);
      } catch (error) {
        // Error loading model via V3 system
      }
    });

    this.containerElement.appendChild(select);
    this.selectElement = select;
  }
}

// Register the custom element
customElements.define('model-selector', ModelSelector);