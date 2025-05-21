/**
 * ModelSelector Web Component
 * 
 * Provides a dropdown for selecting different models.
 * Uses the Light DOM approach (no Shadow DOM).
 */

import { currentModelId, availableModels, loadModel } from '../../state/store';

export class ModelSelector extends HTMLElement {
  private containerElement: HTMLElement | null = null;
  private selectElement: HTMLSelectElement | null = null;
  private unsubscribe: (() => void) | null = null;
  
  constructor() {
    super();
    console.log('ModelSelector: Constructed');
  }
  
  connectedCallback() {
    console.log('ModelSelector: Connected');
    
    // Create container if needed
    this.containerElement = this.querySelector('.model-selector') || 
                           this.createContainerElement();
    
    // Subscribe to currentModelId signal to update selection
    this.unsubscribe = currentModelId.subscribe(modelId => {
      if (this.selectElement && this.selectElement.value !== modelId) {
        this.selectElement.value = modelId;
      }
    });
    
    // Initial render
    this.renderModelSelector();
  }
  
  disconnectedCallback() {
    console.log('ModelSelector: Disconnected');
    
    // Clean up subscription when element is removed
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
  
  /**
   * Create the container element if it doesn't exist
   */
  private createContainerElement() {
    console.log('ModelSelector: Creating container element');
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
    
    console.log('ModelSelector: Rendering model selector');
    
    // Clear existing content
    this.containerElement.innerHTML = '';
    
    // Create label
    const label = document.createElement('label');
    label.textContent = 'Select model: ';
    label.htmlFor = 'model-select';
    this.containerElement.appendChild(label);
    
    // Create select element
    const select = document.createElement('select');
    select.id = 'model-select';
    
    // Add options for each available model
    availableModels.value.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.name;
      select.appendChild(option);
    });
    
    // Set initial selection
    select.value = currentModelId.value;
    
    // Add change handler
    select.addEventListener('change', async (e) => {
      const modelId = (e.target as HTMLSelectElement).value;
      try {
        await loadModel(modelId);
      } catch (error) {
        console.error('Error loading model:', error);
      }
    });
    
    this.containerElement.appendChild(select);
    this.selectElement = select;
  }
}

// Register the custom element
customElements.define('model-selector', ModelSelector);