/**
 * Logo Animation Handler
 * 
 * Handles logo animation requests by listening for custom events
 * and triggering animations on the manifold-logo element.
 * 
 * This module provides loose coupling between parameter changes
 * and logo animations through a custom event system.
 */

/**
 * Logo Animation Handler Class
 * 
 * Manages the connection between LogoAnimationRequest events
 * and the manifold-logo web component animations.
 */
export class LogoAnimationHandler {
  private isInitialized: boolean = false;
  private logoElement: any = null; // ManifoldLogo element
  private eventListener: ((event: Event) => void) | null = null;

  /**
   * Initialize the logo animation handler
   * Sets up event listeners and finds the logo element
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('LogoAnimationHandler: Already initialized');
      return;
    }

    // Find the manifold-logo element
    this.findLogoElement();

    // Set up event listener for LogoAnimationRequest events
    this.setupEventListener();

    this.isInitialized = true;
    console.log('LogoAnimationHandler: Initialized successfully');
  }

  /**
   * Find the manifold-logo element in the DOM
   * Retries if not found initially (in case DOM is still loading)
   */
  private findLogoElement(): void {
    this.logoElement = document.querySelector('manifold-logo');
    
    if (!this.logoElement) {
      console.warn('LogoAnimationHandler: manifold-logo element not found, will retry on animation request');
    } else {
      console.log('LogoAnimationHandler: Found manifold-logo element');
    }
  }

  /**
   * Set up the event listener for LogoAnimationRequest events
   */
  private setupEventListener(): void {
    this.eventListener = (event: Event) => {
      this.handleAnimationRequest(event as CustomEvent);
    };

    document.addEventListener('LogoAnimationRequest', this.eventListener);
    console.log('LogoAnimationHandler: Event listener registered for LogoAnimationRequest');
  }

  /**
   * Handle a LogoAnimationRequest event
   * Triggers the logo animation if the element is available
   */
  private handleAnimationRequest(event: CustomEvent): void {
    console.log('LogoAnimationHandler: Received LogoAnimationRequest event', event.detail);

    // Try to find logo element if we don't have it yet
    if (!this.logoElement) {
      this.findLogoElement();
    }

    // If we still don't have the logo element, log warning and return
    if (!this.logoElement) {
      console.warn('LogoAnimationHandler: Cannot animate - manifold-logo element not found');
      return;
    }

    // Check if the logo element has the startOnce method
    if (typeof this.logoElement.startOnce === 'function') {
      try {
        this.logoElement.startOnce();
        console.log('LogoAnimationHandler: Logo animation triggered successfully');
      } catch (error) {
        console.error('LogoAnimationHandler: Error triggering logo animation:', error);
      }
    } else {
      console.warn('LogoAnimationHandler: manifold-logo element does not have startOnce method');
    }
  }

  /**
   * Cleanup the handler
   * Removes event listeners and resets state
   */
  cleanup(): void {
    if (this.eventListener) {
      document.removeEventListener('LogoAnimationRequest', this.eventListener);
      this.eventListener = null;
    }

    this.logoElement = null;
    this.isInitialized = false;
    console.log('LogoAnimationHandler: Cleaned up successfully');
  }

  /**
   * Check if the handler is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Global instance for the logo animation handler
let logoAnimationHandler: LogoAnimationHandler | null = null;

/**
 * Initialize the global logo animation handler
 * This should be called once during configurator initialization
 */
export function initializeLogoAnimationHandler(): void {
  if (logoAnimationHandler) {
    console.warn('LogoAnimationHandler: Global handler already exists');
    return;
  }

  logoAnimationHandler = new LogoAnimationHandler();
  logoAnimationHandler.initialize();
}

/**
 * Get the global logo animation handler instance
 * Returns null if not initialized
 */
export function getLogoAnimationHandler(): LogoAnimationHandler | null {
  return logoAnimationHandler;
}

/**
 * Cleanup the global logo animation handler
 * Useful for testing or when shutting down the configurator
 */
export function cleanupLogoAnimationHandler(): void {
  if (logoAnimationHandler) {
    logoAnimationHandler.cleanup();
    logoAnimationHandler = null;
  }
}

/**
 * Utility function to manually trigger a logo animation
 * Dispatches a LogoAnimationRequest event
 */
export function triggerLogoAnimation(reason?: string): void {
  const event = new CustomEvent('LogoAnimationRequest', {
    detail: {
      reason: reason || 'manual',
      timestamp: Date.now()
    }
  });

  document.dispatchEvent(event);
  console.log('LogoAnimationHandler: Manually triggered LogoAnimationRequest event');
}
