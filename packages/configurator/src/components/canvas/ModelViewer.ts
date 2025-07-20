/**
 * ModelViewer Web Component
 *
 * Handles the model-viewer element updates based on state changes.
 * Uses the Light DOM approach (no Shadow DOM).
 *
 * Updated to use V3 state management system.
 */

import { v3Signals } from "../../state/v3-bridge";
import { ModelViewerElement } from "@google/model-viewer";

export class ModelViewer extends HTMLElement {
  private viewerElement: ModelViewerElement | null = null;
  private unsubscribeUrls: (() => void) | null = null;
  private unsubscribeMetadata: (() => void) | null = null;

  constructor() {
    super();
  }

  connectedCallback() {
    // Find the model viewer element - this could be the element itself or a child
    this.viewerElement =
      this.id === "viewer"
        ? (this as unknown as ModelViewerElement)
        : this.querySelector<ModelViewerElement>("#viewer");

    if (!this.viewerElement) {
      return;
    }

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
    if (!this.viewerElement) return;

    // Subscribe to V3 modelUrls signal to update the src attribute
    this.unsubscribeUrls = v3Signals.modelUrls.subscribe((urls) => {
      if (this.viewerElement && urls.glbUrl) {
        // Check if this is a development update with timestamp
        const hasTimestamp = !!(globalThis as any).__MODEL_REBUILD_TIMESTAMP__;
        const isDevUpdate = import.meta.env.DEV && hasTimestamp;

        if (isDevUpdate) {
          // Use advanced update method for HMR to force model-viewer reload
          this.updateModelViewerSrc(urls.glbUrl);
        } else {
          // Standard src update for production
          this.viewerElement.src = urls.glbUrl;
        }
      }
    });

    // Subscribe to V3 modelMetadata signal to update the alt text
    this.unsubscribeMetadata = v3Signals.modelMetadata.subscribe((metadata) => {
      if (this.viewerElement && metadata) {
        this.viewerElement.alt = metadata.description || "A 3D model";
      }
    });

    // Initial render if we already have values
    if (v3Signals.modelUrls.value.glbUrl) {
      this.viewerElement.src = v3Signals.modelUrls.value.glbUrl;
    }

    if (v3Signals.modelMetadata.value) {
      this.viewerElement.alt =
        v3Signals.modelMetadata.value.description || "A 3D model";
    }
  }

  disconnectedCallback() {

    // Clean up subscriptions when element is removed
    if (this.unsubscribeUrls) {
      this.unsubscribeUrls();
      this.unsubscribeUrls = null;
    }

    if (this.unsubscribeMetadata) {
      this.unsubscribeMetadata();
      this.unsubscribeMetadata = null;
    }
  }

  /**
   * Update model-viewer src using forced reload for HMR
   */
  private updateModelViewerSrc(newSrc: string): void {
    if (!this.viewerElement) return;

    // Clear src first, then set new one to force reload
    this.viewerElement.src = '';
    this.viewerElement.removeAttribute('src');

    // Wait a tick, then set new src
    setTimeout(() => {
      this.viewerElement!.setAttribute('src', newSrc);
      this.viewerElement!.src = newSrc;
    }, 10);
  }
}

// Register the custom element
customElements.define("model-viewer-wrapper", ModelViewer);
