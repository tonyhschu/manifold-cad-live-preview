# Web Components Architecture with Preact Signals

This document describes the architecture used for building UI components with Web Components and Preact Signals state management.

## Core Pattern

### 1. Centralized State Store

First, we created a centralized state store using Preact Signals to manage all application state:

```typescript
// src/state/store.ts
import { signal, computed } from '@preact/signals';

// Define signals for different pieces of state
export const status = signal({ message: 'Ready', isError: false });
export const modelUrls = signal({ objUrl: '', glbUrl: '' });
export const currentModelId = signal('demo');

// Computed values derived from signals
export const isModelLoading = computed(() => 
  status.value.message.includes('Loading')
);

// Actions to modify state
export async function loadModel(modelId: string) {
  // Update multiple signals in a coordinated way
  currentModelId.value = modelId;
  status.value = { message: `Loading: ${modelId}...`, isError: false };
  // ...other state updates
}
```

### 2. Web Component Structure

Each Web Component follows a consistent pattern:

```typescript
import { someSignal } from '../../state/store';

export class MyComponent extends HTMLElement {
  private someElement: HTMLElement | null = null;
  private unsubscribe: (() => void) | null = null;
  
  connectedCallback() {
    // 1. Find or create elements in Light DOM
    this.someElement = this.querySelector('.some-class') || this.createFallbackElement();
    
    // 2. Subscribe to signals
    this.unsubscribe = someSignal.subscribe(value => {
      this.updateUI(value);
    });
    
    // 3. Initial render using current signal value
    this.updateUI(someSignal.value);
  }
  
  disconnectedCallback() {
    // Clean up subscription
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
  
  // Private update method
  private updateUI(value: any) {
    if (!this.someElement) return;
    // Update DOM based on state
  }
}

// Register the component
customElements.define('my-component', MyComponent);
```

## Key Integration Points

1. **Signal Subscription**:
   - Components subscribe to signals in `connectedCallback()`
   - The subscription returns a cleanup function stored for later use
   - Components unsubscribe in `disconnectedCallback()` to prevent memory leaks

2. **Light DOM Approach**:
   - Components work with existing HTML elements via `querySelector()`
   - They also create fallback elements if needed
   - No Shadow DOM means CSS from the main stylesheet applies directly

3. **One-Way Data Flow**:
   - Signals flow down into components as read-only state
   - Components dispatch events or call actions to request state changes
   - State is only modified through the centralized store

4. **Signal Granularity**:
   - Multiple fine-grained signals are preferred over one large state object
   - Only components that need specific state will rerender when it changes

## Advantages

1. **Performance**: Components only update when relevant state changes
2. **Decoupling**: Components don't need to know about each other
3. **Testability**: State logic is separated from DOM manipulation
4. **Consistency**: Every component follows the same integration pattern
5. **No Shadow DOM**: Preserves existing styling capabilities

## Examples

### StatusBar Component

```typescript
import { status } from '../../state/store';

export class StatusBar extends HTMLElement {
  private statusElement: HTMLElement | null = null;
  private unsubscribe: (() => void) | null = null;
  
  connectedCallback() {
    // Find or create status element
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
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
  
  private createStatusElement() {
    const element = document.createElement('div');
    element.id = 'status';
    this.appendChild(element);
    return element;
  }
}

customElements.define('status-bar', StatusBar);
```

### DownloadPanel Component

```typescript
import { modelUrls } from '../../state/store';

export class DownloadPanel extends HTMLElement {
  private containerElement: HTMLElement | null = null;
  private unsubscribe: (() => void) | null = null;
  
  connectedCallback() {
    // Find or create container
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
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
  
  private createContainerElement() {
    const container = document.createElement('div');
    container.className = 'download-container';
    this.appendChild(container);
    return container;
  }
  
  private renderDownloadLinks(objUrl: string, glbUrl: string) {
    if (!this.containerElement) return;
    
    // Clear existing links
    this.containerElement.innerHTML = '';
    
    // Only render if we have URLs
    if (!objUrl && !glbUrl) return;
    
    // Create download links
    if (objUrl) {
      const objDownloadLink = document.createElement("a");
      objDownloadLink.href = objUrl;
      objDownloadLink.download = "manifold-model.obj";
      objDownloadLink.textContent = "Download OBJ Model";
      objDownloadLink.className = "download-btn";
      this.containerElement.appendChild(objDownloadLink);
    }
    
    if (glbUrl) {
      const glbDownloadLink = document.createElement("a");
      glbDownloadLink.href = glbUrl;
      glbDownloadLink.download = "manifold-model.glb";
      glbDownloadLink.textContent = "Download GLB Model";
      glbDownloadLink.className = "download-btn";
      this.containerElement.appendChild(glbDownloadLink);
    }
  }
}

customElements.define('download-panel', DownloadPanel);
```

## Resources

- [Preact Signals Documentation](https://preactjs.com/guide/v10/signals/)
- [Web Components MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
- [Light DOM Web Components](https://frontendmasters.com/blog/light-dom-only/)