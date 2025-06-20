import { ParameterManager } from '../../core/parameter-manager';
import { currentParametricConfig, updateModel, modelUrls } from '../../state/store';
import { getExportService } from '../../services';
import type { ParametricConfig } from '@manifold-studio/wrapper';

export class ParametricPanel extends HTMLElement {
  private parameterManager: ParameterManager | null = null;
  private unsubscribe: (() => void) | null = null;
  private currentConfig: ParametricConfig | null = null;

  connectedCallback() {
    this.className = 'parametric-panel';
    this.innerHTML = `
      <div class="parametric-panel-header">
        <h3>Parameters</h3>
      </div>
      <div class="parametric-panel-content" id="tweakpane-container">
        <p>Select a parametric model to configure</p>
      </div>
    `;

    // Subscribe to parametric config changes
    this.unsubscribe = currentParametricConfig.subscribe(config => {
      this.handleConfigChange(config);
    });
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.cleanup();
  }

  private handleConfigChange(config: ParametricConfig | null) {
    if (config) {
      this.setupParametricUI(config);
    } else {
      this.cleanup();
      this.showNoParametersMessage();
    }
  }


  private setupParametricUI(config: ParametricConfig) {
    this.cleanup();
    this.currentConfig = config;

    const container = this.querySelector('#tweakpane-container') as HTMLElement;
    if (!container) return;

    // Clear container
    container.innerHTML = '';

    // Show model name and description
    if (config.name || config.description) {
      const header = document.createElement('div');
      header.className = 'parametric-model-info';

      if (config.name) {
        const title = document.createElement('h4');
        title.textContent = config.name;
        header.appendChild(title);
      }

      if (config.description) {
        const desc = document.createElement('p');
        desc.textContent = config.description;
        desc.className = 'model-description';
        header.appendChild(desc);
      }

      container.appendChild(header);
    }

    // Create Tweakpane container
    const tweakpaneContainer = document.createElement('div');
    tweakpaneContainer.className = 'tweakpane-container';
    container.appendChild(tweakpaneContainer);

    try {
      // Initialize parameter manager
      this.parameterManager = new ParameterManager(config, tweakpaneContainer);

      // Listen for model generation events
      this.setupModelGenerationListener();

    } catch (error) {
      console.error('Failed to setup parametric UI:', error);
      this.showErrorMessage(container, error);
    }
  }

  private setupModelGenerationListener() {
    // Listen for model generation from ParameterManager
    const handleModelGenerated = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { manifold, params } = customEvent.detail;

      // Update the global model state
      updateModel(manifold);

      // Generate new exports for the updated model
      await this.updateModelExports(manifold);

      // Optionally store current parameters for persistence
      this.storeCurrentParameters(params);
    };

    const handleModelError = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.error('Model generation error:', customEvent.detail.error);
      // Could show error UI here
    };

    document.addEventListener('modelGenerated', handleModelGenerated);
    document.addEventListener('modelGenerationError', handleModelError);

    // Store cleanup for these listeners
    const originalCleanup = this.cleanup.bind(this);
    this.cleanup = () => {
      document.removeEventListener('modelGenerated', handleModelGenerated);
      document.removeEventListener('modelGenerationError', handleModelError);
      originalCleanup();
    };
  }

  private async updateModelExports(manifold: any) {
    try {
      const exportService = getExportService();

      // Generate OBJ export
      const objResult = await exportService.exportToOBJ(manifold, 'parametric-model.obj');

      // Generate GLB export
      const glbResult = await exportService.exportToGLB(manifold, 'parametric-model.glb');

      // Update model URLs in store
      modelUrls.value = {
        objUrl: objResult.url,
        glbUrl: glbResult.url
      };

    } catch (error) {
      console.error('Failed to generate exports for parametric model:', error);
    }
  }

  private storeCurrentParameters(params: Record<string, any>) {
    // Store in localStorage for persistence
    if (this.currentConfig && this.currentConfig.name) {
      const key = `parametric-params-${this.currentConfig.name}`;
      try {
        localStorage.setItem(key, JSON.stringify(params));
      } catch (error) {
        console.warn('Failed to store parameters:', error);
      }
    }
  }


  private cleanup() {
    if (this.parameterManager) {
      this.parameterManager.destroy();
      this.parameterManager = null;
    }
    this.currentConfig = null;
  }

  private showNoParametersMessage() {
    const container = this.querySelector('#tweakpane-container') as HTMLElement;
    if (container) {
      container.innerHTML = '<p>Select a parametric model to configure</p>';
    }
  }

  private showErrorMessage(container: HTMLElement, error: any) {
    container.innerHTML = `
      <div class="error-message">
        <h4>Configuration Error</h4>
        <p>Failed to load parametric controls: ${error.message || error}</p>
        <details>
          <summary>Details</summary>
          <pre>${error.stack || error.toString()}</pre>
        </details>
      </div>
    `;
  }

  // Public API for external control
  public loadParametricModel(config: ParametricConfig) {
    this.setupParametricUI(config);
  }

  public getCurrentParameters(): Record<string, any> | null {
    return this.parameterManager ? this.parameterManager.getParameters() : null;
  }

  public setParameter(key: string, value: any): void {
    if (this.parameterManager) {
      this.parameterManager.setParameter(key, value);
    }
  }
}

customElements.define('parametric-panel', ParametricPanel);