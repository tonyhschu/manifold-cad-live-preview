/**
 * ModelViewer Web Component
 *
 * Handles the model-viewer element updates based on state changes.
 * Uses the Light DOM approach (no Shadow DOM).
 */

import { modelUrls, modelMetadata } from "../../state/store";
import { ModelViewerElement } from "@google/model-viewer";

export class ModelViewer extends HTMLElement {
  private viewerElement: ModelViewerElement | null = null;
  private unsubscribeUrls: (() => void) | null = null;
  private unsubscribeMetadata: (() => void) | null = null;

  constructor() {
    super();
    console.log("ModelViewer: Constructed");
  }

  connectedCallback() {
    console.log("ModelViewer: Connected");

    // Find the model viewer element - this could be the element itself or a child
    this.viewerElement =
      this.id === "viewer"
        ? (this as unknown as ModelViewerElement)
        : this.querySelector<ModelViewerElement>("#viewer");

    if (!this.viewerElement) {
      console.error(
        'ModelViewer: No model-viewer element found with id "viewer"'
      );
      return;
    }

    // Subscribe to modelUrls signal to update the src attribute
    this.unsubscribeUrls = modelUrls.subscribe((urls) => {
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

    // Subscribe to modelMetadata signal to update the alt text
    this.unsubscribeMetadata = modelMetadata.subscribe((metadata) => {
      if (this.viewerElement && metadata) {
        console.log("ModelViewer: Updating model alt text");
        this.viewerElement.alt = metadata.description || "A 3D model";
      }
    });

    // Initial render if we already have values
    if (this.viewerElement) {
      if (modelUrls.value.glbUrl) {
        this.viewerElement.src = modelUrls.value.glbUrl;
      }

      if (modelMetadata.value) {
        this.viewerElement.alt =
          modelMetadata.value.description || "A 3D model";
      }
    }
  }

  disconnectedCallback() {
    console.log("ModelViewer: Disconnected");

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
