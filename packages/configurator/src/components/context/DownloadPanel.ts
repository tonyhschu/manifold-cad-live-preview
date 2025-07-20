/**
 * DownloadPanel Web Component
 *
 * Provides download links for OBJ and GLB models.
 * Uses the Light DOM approach (no Shadow DOM).
 *
 * Updated to use V3 state management system.
 */

import { v3Signals } from '../../state/v3-bridge';

export class DownloadPanel extends HTMLElement {
  private containerElement: HTMLElement | null = null;
  private unsubscribe: (() => void) | null = null;
  
  constructor() {
    super();
  }

  connectedCallback() {
    // Find existing container or create it
    this.containerElement = this.querySelector('.download-container') ||
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
    // Subscribe to V3 modelUrls signal
    this.unsubscribe = v3Signals.modelUrls.subscribe(urls => {
      this.renderDownloadLinks(urls.objUrl, urls.glbUrl);
    });

    // Initial render
    this.renderDownloadLinks(v3Signals.modelUrls.value.objUrl, v3Signals.modelUrls.value.glbUrl);
  }
  
  disconnectedCallback() {
    
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
    const container = document.createElement('div');
    container.className = 'download-container';
    this.appendChild(container);
    return container;
  }
  
  /**
   * Render download links based on available URLs
   */
  private renderDownloadLinks(objUrl: string, glbUrl: string) {
    if (!this.containerElement) return;
    

    
    // Clear existing links
    this.containerElement.innerHTML = '';
    
    // Only render if we have URLs
    if (!objUrl && !glbUrl) return;
    
    // Create OBJ download link if URL exists
    if (objUrl) {
      const objDownloadLink = document.createElement("a");
      objDownloadLink.href = objUrl;
      objDownloadLink.download = "manifold-model.obj";
      objDownloadLink.textContent = "Download OBJ";
      objDownloadLink.className = "download-btn";
      this.containerElement.appendChild(objDownloadLink);
      
      // Add analytics event
      objDownloadLink.addEventListener('click', () => {

      });
    }
    
    // Create GLB download link if URL exists
    if (glbUrl) {
      const glbDownloadLink = document.createElement("a");
      glbDownloadLink.href = glbUrl;
      glbDownloadLink.download = "manifold-model.glb";
      glbDownloadLink.textContent = "Download GLB";
      glbDownloadLink.className = "download-btn";
      this.containerElement.appendChild(glbDownloadLink);
      
      // Add analytics event
      glbDownloadLink.addEventListener('click', () => {

      });
    }
  }
}

// Register the custom element
customElements.define('download-panel', DownloadPanel);