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
        console.log("🔧 ModelViewer: Received new GLB URL:", urls.glbUrl);
        console.log("🔧 ModelViewer: Current src:", this.viewerElement.src);

        // Check if this is an HMR update (different blob URL)
        const hasTimestamp = !!(globalThis as any).__MODEL_REBUILD_TIMESTAMP__;
        const hasSrc = !!this.viewerElement.src;
        const isDifferentUrl = this.viewerElement.src !== urls.glbUrl;

        console.log("🔧 ModelViewer: HMR check - hasTimestamp:", hasTimestamp, "hasSrc:", hasSrc, "isDifferentUrl:", isDifferentUrl);

        const isHMRUpdate = import.meta.env.DEV && hasTimestamp && hasSrc && isDifferentUrl;
        const isDevUpdate = import.meta.env.DEV && hasTimestamp; // Any dev update with timestamp

        if (isDevUpdate) {
          console.log("🔄 Dev update detected - using advanced update method");
          this.updateModelViewerSrc(urls.glbUrl);
        } else {
          console.log("🔧 ModelViewer: Setting src directly");
          this.viewerElement.src = urls.glbUrl;
          console.log("🔧 ModelViewer: After setting src:", this.viewerElement.src);
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
   * Update model-viewer src using multiple approaches for HMR
   */
  private updateModelViewerSrc(newSrc: string): void {
    if (!this.viewerElement) return;

    console.log("🔄 Updating model-viewer src with multiple approaches...");
    console.log("📍 Old src:", this.viewerElement.src);
    console.log("📍 New src:", newSrc);

    // Approach 1: Clear src first, then set new one
    console.log("🔄 Approach 1: Clear and set");
    this.viewerElement.src = '';
    this.viewerElement.removeAttribute('src');

    // Wait a tick, then set new src
    setTimeout(() => {
      this.viewerElement!.setAttribute('src', newSrc);
      console.log("✅ setAttribute applied:", newSrc);

      // Also set property for good measure
      this.viewerElement!.src = newSrc;
      console.log("✅ Property set:", newSrc);

      // Force a reload event
      this.viewerElement!.dispatchEvent(new Event('src-changed'));
      console.log("✅ src-changed event dispatched");

      // Debug: Check if blob is actually different
      this.debugBlobContent(newSrc);

      // Nuclear option: Force model-viewer to reload
      setTimeout(() => {
        this.forceModelViewerReload();
      }, 100);

    }, 10);
  }

  /**
   * Recreate the model-viewer element for HMR updates
   */
  // private recreateModelViewer(newSrc: string): void {
  //   if (!this.viewerElement) return;

  //   console.log("🔄 Recreating model-viewer element...");

  //   // Preserve current camera state
  //   const currentOrbit = this.viewerElement.cameraOrbit;
  //   const currentTarget = this.viewerElement.cameraTarget;

  //   // Get the parent container
  //   const parent = this.viewerElement.parentElement;
  //   if (!parent) {
  //     console.warn("⚠️ No parent element found for model-viewer");
  //     return;
  //   }

  //   // Create new model-viewer element
  //   const newViewer = document.createElement('model-viewer') as ModelViewerElement;
  //   newViewer.id = 'viewer';
  //   newViewer.setAttribute('camera-controls', '');
  //   newViewer.setAttribute('interaction-prompt', 'none');
  //   newViewer.setAttribute('rotations-per-second', '0rad');
  //   newViewer.setAttribute('auto-rotate-delay', 'Infinity');
  //   newViewer.setAttribute('auto-rotate', 'false');
  //   newViewer.setAttribute('alt', '3D model');
  //   newViewer.style.cssText = 'width: 100%; height: 100%; background-color: #f5f5f5;';

  //   // Set the new source
  //   newViewer.src = newSrc;

  //   // Replace the old element
  //   parent.replaceChild(newViewer, this.viewerElement);
  //   this.viewerElement = newViewer;

  //   // Restore camera state after the model loads
  //   newViewer.addEventListener('load', () => {
  //     if (currentOrbit) {
  //       newViewer.cameraOrbit = currentOrbit;
  //     }
  //     if (currentTarget) {
  //       newViewer.cameraTarget = currentTarget;
  //     }
  //     console.log("📷 Camera state restored after model-viewer recreation");
  //   }, { once: true });

  //   console.log("✅ Model-viewer element recreated with new source");
  // }

  /**
   * Debug blob content to verify it's actually different
   */
  private async debugBlobContent(blobUrl: string): Promise<void> {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const hash = await this.simpleHash(arrayBuffer);

      const lastHash = (globalThis as any).__LAST_BLOB_HASH__;
      const isContentDifferent = lastHash && lastHash !== hash;

      console.log("🔍 Blob debug info:", {
        url: blobUrl,
        size: blob.size,
        type: blob.type,
        hash: hash.substring(0, 8), // First 8 chars of hash
        lastHash: lastHash ? lastHash.substring(0, 8) : 'none',
        isContentDifferent: isContentDifferent
      });

      if (!isContentDifferent && lastHash) {
        console.warn("⚠️ BLOB CONTENT IS IDENTICAL! Model changes didn't affect geometry.");
      } else if (isContentDifferent) {
        console.log("✅ Blob content is different - model changes detected");
      }

      // Store hash to compare with next update
      (globalThis as any).__LAST_BLOB_HASH__ = hash;

    } catch (error) {
      console.warn("⚠️ Could not debug blob content:", error);
    }
  }

  /**
   * Force model-viewer to reload by trying multiple approaches
   */
  private forceModelViewerReload(): void {
    if (!this.viewerElement) return;

    console.log("💥 Nuclear option: Forcing model-viewer reload...");

    // Try triggering internal model-viewer events
    try {
      // Method 1: Dispatch load event
      this.viewerElement.dispatchEvent(new Event('load'));

      // Method 2: Call internal methods if they exist
      if ((this.viewerElement as any).dismissPoster) {
        (this.viewerElement as any).dismissPoster();
      }

      // Method 3: Force re-render
      if ((this.viewerElement as any).requestUpdate) {
        (this.viewerElement as any).requestUpdate();
      }

      // Method 4: Trigger resize (sometimes forces reload)
      this.viewerElement.dispatchEvent(new Event('resize'));

      console.log("💥 All force reload methods attempted");

    } catch (error) {
      console.warn("⚠️ Error during force reload:", error);
    }
  }

  /**
   * Simple hash function for blob content comparison
   */
  private async simpleHash(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// Register the custom element
customElements.define("model-viewer-wrapper", ModelViewer);
