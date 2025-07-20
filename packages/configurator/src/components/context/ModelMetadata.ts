/**
 * ModelMetadata Web Component
 *
 * Displays model metadata information (name, description, author, etc.)
 * Subscribes to the global modelMetadata signal to show information for all model types.
 *
 * Updated to use V3 state management system.
 */

import { v3Signals } from '../../state/v3-bridge';
import type { ModelMetadata as ModelMetadataType } from '../../core/model-loader';

export class ModelMetadata extends HTMLElement {
  private unsubscribeMetadata: (() => void) | null = null;

  connectedCallback() {
    this.className = 'model-metadata';
    this.innerHTML = `
      <div class="model-metadata-content">
        <p class="no-model-message">Select a model to view details</p>
      </div>
    `;

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
    // Subscribe to V3 model metadata changes (single source of truth)
    this.unsubscribeMetadata = v3Signals.modelMetadata.subscribe(metadata => {
      this.handleMetadataChange(metadata);
    });
  }

  disconnectedCallback() {
    if (this.unsubscribeMetadata) {
      this.unsubscribeMetadata();
      this.unsubscribeMetadata = null;
    }
  }

  private handleMetadataChange(metadata: ModelMetadataType | null) {
    // Single source of truth: modelMetadata signal contains metadata for all model types
    if (metadata) {
      this.renderMetadata(metadata);
    } else {
      this.showNoModelMessage();
    }
  }

  private renderMetadata(metadata: ModelMetadataType) {
    const container = this.querySelector('.model-metadata-content') as HTMLElement;
    if (!container) return;

    // Clear container
    container.innerHTML = '';

    // Create metadata display
    const metadataDiv = document.createElement('div');
    metadataDiv.className = 'model-info';

    // Model name
    if (metadata.name) {
      const title = document.createElement('h4');
      title.textContent = metadata.name;
      title.className = 'model-title';
      metadataDiv.appendChild(title);
    }

    // Model description
    if (metadata.description) {
      const desc = document.createElement('p');
      desc.textContent = metadata.description;
      desc.className = 'model-description';
      metadataDiv.appendChild(desc);
    }

    // Additional metadata (author, version, tags)
    const additionalInfo = [];
    if (metadata.author) additionalInfo.push(`Author: ${metadata.author}`);
    if (metadata.version) additionalInfo.push(`Version: ${metadata.version}`);
    if (metadata.tags && metadata.tags.length > 0) {
      additionalInfo.push(`Tags: ${metadata.tags.join(', ')}`);
    }

    if (additionalInfo.length > 0) {
      const infoDiv = document.createElement('div');
      infoDiv.className = 'model-additional-info';
      
      additionalInfo.forEach(info => {
        const infoPara = document.createElement('p');
        infoPara.textContent = info;
        infoPara.className = 'model-info-item';
        infoDiv.appendChild(infoPara);
      });
      
      metadataDiv.appendChild(infoDiv);
    }

    container.appendChild(metadataDiv);
  }

  private showNoModelMessage() {
    const container = this.querySelector('.model-metadata-content') as HTMLElement;
    if (!container) return;

    container.innerHTML = '<p class="no-model-message">Select a model to view details</p>';
  }
}

customElements.define('model-metadata', ModelMetadata);
