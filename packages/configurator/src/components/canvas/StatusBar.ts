/**
 * StatusBar Web Component
 *
 * Displays status messages and errors to the user.
 * Uses the Light DOM approach (no Shadow DOM).
 *
 * Updated to use V3 state management system.
 */

import { v3Signals } from '../../state/v3-bridge';

export class StatusBar extends HTMLElement {
  private statusElement: HTMLElement | null = null;
  private unsubscribe: (() => void) | null = null;
  
  constructor() {
    super();

  }
  
  connectedCallback() {


    // Find existing status element or create if needed
    this.statusElement = this.querySelector('#status') || this.createStatusElement();

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
    if (!this.statusElement) return;

    // Subscribe to V3 status signal
    this.unsubscribe = v3Signals.status.subscribe(value => {
      if (this.statusElement) {
        this.statusElement.textContent = value.message;
        this.statusElement.className = value.isError ? "error" : "";
      }
    });

    // Initial render
    this.statusElement.textContent = v3Signals.status.value.message;
    this.statusElement.className = v3Signals.status.value.isError ? "error" : "";
  }
  
  disconnectedCallback() {

    
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

    const element = document.createElement('div');
    element.id = 'status';
    this.appendChild(element);
    return element;
  }
}

// Register the custom element
customElements.define('status-bar', StatusBar);