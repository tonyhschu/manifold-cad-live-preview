/**
 * DownloadPanel Web Component
 * 
 * Provides download links for OBJ and GLB models.
 * Uses the Light DOM approach (no Shadow DOM).
 */

import { modelUrls } from '../../state/store';

export class DownloadPanel extends HTMLElement {
  private containerElement: HTMLElement | null = null;
  private unsubscribe: (() => void) | null = null;
  
  constructor() {
    super();
    console.log('DownloadPanel: Constructed');
  }
  
  connectedCallback() {
    console.log('DownloadPanel: Connected');
    
    // Find existing container or create it
    this.containerElement = this.querySelector('.download-container') || 
                           this.createContainerElement();
    
    // Subscribe to modelUrls signal
    this.unsubscribe = modelUrls.subscribe(urls => {
      this.renderDownloadLinks(urls.objUrl, urls.glbUrl);
    });
    
    // Initial render
    this.renderDownloadLinks(modelUrls.value.objUrl, modelUrls.value.glbUrl);
  }
  
  disconnectedCallback() {
    console.log('DownloadPanel: Disconnected');
    
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
    console.log('DownloadPanel: Creating container element');
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
    
    console.log('DownloadPanel: Rendering download links', { objUrl, glbUrl });
    
    // Clear existing links
    this.containerElement.innerHTML = '';
    
    // Only render if we have URLs
    if (!objUrl && !glbUrl) return;
    
    // Create OBJ download link if URL exists
    if (objUrl) {
      const objDownloadLink = document.createElement("a");
      objDownloadLink.href = objUrl;
      objDownloadLink.download = "manifold-model.obj";
      objDownloadLink.textContent = "Download OBJ Model";
      objDownloadLink.className = "download-btn";
      this.containerElement.appendChild(objDownloadLink);
      
      // Add analytics event
      objDownloadLink.addEventListener('click', () => {
        console.log('OBJ download started');
      });
    }
    
    // Create GLB download link if URL exists
    if (glbUrl) {
      const glbDownloadLink = document.createElement("a");
      glbDownloadLink.href = glbUrl;
      glbDownloadLink.download = "manifold-model.glb";
      glbDownloadLink.textContent = "Download GLB Model";
      glbDownloadLink.className = "download-btn";
      this.containerElement.appendChild(glbDownloadLink);
      
      // Add analytics event
      glbDownloadLink.addEventListener('click', () => {
        console.log('GLB download started');
      });
    }
  }
}

// Register the custom element
customElements.define('download-panel', DownloadPanel);