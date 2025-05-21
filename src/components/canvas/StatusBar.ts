/**
 * StatusBar Web Component
 * 
 * Displays status messages and errors to the user.
 * Uses the Light DOM approach (no Shadow DOM).
 */

import { status } from '../../state/store';

export class StatusBar extends HTMLElement {
  private statusElement: HTMLElement | null = null;
  private unsubscribe: (() => void) | null = null;
  
  constructor() {
    super();
    console.log('StatusBar: Constructed');
  }
  
  connectedCallback() {
    console.log('StatusBar: Connected');
    
    // Find existing status element or create if needed
    this.statusElement = this.querySelector('#status') || this.createStatusElement();
    
    // Subscribe to status signal
    this.unsubscribe = status.subscribe(value => {
      if (this.statusElement) {
        this.statusElement.textContent = value.message;
        this.statusElement.className = value.isError ? "error" : "";
      }
    });
    
    // Initial render
    if (this.statusElement) {
      this.statusElement.textContent = status.value.message;
      this.statusElement.className = status.value.isError ? "error" : "";
    }
  }
  
  disconnectedCallback() {
    console.log('StatusBar: Disconnected');
    
    // Clean up subscription when element is removed
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
  
  /**
   * Create the status element if it doesn't exist
   */
  private createStatusElement() {
    console.log('StatusBar: Creating status element');
    const element = document.createElement('div');
    element.id = 'status';
    this.appendChild(element);
    return element;
  }
}

// Register the custom element
customElements.define('status-bar', StatusBar);