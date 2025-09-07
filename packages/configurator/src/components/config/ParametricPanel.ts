import { ParameterManager } from '../../core/parameter-manager';
import { v3Signals, v3Actions } from '../../state/v3-bridge';
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
        <button class="reset-button" id="reset-parameters-btn" style="display: none;">Reset</button>
      </div>
      <div class="parametric-panel-content" id="tweakpane-container">
        <p>Select a parametric model to configure</p>
      </div>
    `;

    // Add event listener for reset button
    const resetButton = this.querySelector('#reset-parameters-btn') as HTMLButtonElement;
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        this.resetParameters();
      });
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
    // Subscribe to parametric config changes from V3 bridge
    this.unsubscribe = v3Signals.parametricConfig.subscribe(config => {
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
    const resetButton = this.querySelector('#reset-parameters-btn') as HTMLButtonElement;

    if (config) {
      // Validate that the config has the expected structure
      if (!config.parameters || typeof config.parameters !== 'object' || !config.generateModel) {
        console.warn('ParametricPanel: Received invalid config, ignoring:', config);
        return;
      }

      console.log('ParametricPanel: Received valid config:', config);

      this.setupParametricUI(config);
      // Show reset button for parametric models
      if (resetButton) {
        resetButton.style.display = 'inline-block';
      }
    } else {
      this.cleanup();
      this.showNoParametersMessage();
      // Hide reset button for non-parametric models
      if (resetButton) {
        resetButton.style.display = 'none';
      }
    }
  }


  private setupParametricUI(config: ParametricConfig) {
    this.cleanup();
    this.currentConfig = config;

    const container = this.querySelector('#tweakpane-container') as HTMLElement;
    if (!container) return;

    // Clear container
    container.innerHTML = '';

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
      this.showErrorMessage(container, error);
    }
  }

  private setupModelGenerationListener() {
    // Listen for model generation from ParameterManager
    const handleModelGenerated = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { manifold, params } = customEvent.detail;

      // Store current parameters for persistence (no model reload needed - that's handled reactively)
      this.storeCurrentParameters(params);

      // Emit LogoAnimationRequest event to trigger logo animation
      this.emitLogoAnimationRequest('parameter-change', params);

    };

    const handleModelError = (event: Event) => {
      const customEvent = event as CustomEvent;
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

  /**
   * Emit a LogoAnimationRequest event to trigger logo animation
   * This provides loose coupling between parameter changes and logo animations
   */
  private emitLogoAnimationRequest(reason: string, params?: Record<string, any>) {
    const event = new CustomEvent('LogoAnimationRequest', {
      detail: {
        reason,
        params,
        modelName: this.currentConfig?.name,
        timestamp: Date.now()
      }
    });

    document.dispatchEvent(event);
    console.log('ParametricPanel: Emitted LogoAnimationRequest event', { reason, modelName: this.currentConfig?.name });
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
      container.innerHTML = '<div class="no-parameters-message"><p>This model has no tweakable parameters.</p></div>';
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

    // Show reset button for parametric models
    const resetButton = this.querySelector('#reset-parameters-btn') as HTMLButtonElement;
    if (resetButton) {
      resetButton.style.display = 'inline-block';
    }
  }

  public getCurrentParameters(): Record<string, any> | null {
    return this.parameterManager ? this.parameterManager.getParameters() : null;
  }

  public setParameter(key: string, value: any): void {
    if (this.parameterManager) {
      this.parameterManager.setParameter(key, value);
    }
  }

  public resetParameters(): void {
    if (this.parameterManager) {
      this.parameterManager.resetToDefaults();

      // Emit LogoAnimationRequest event for reset action
      this.emitLogoAnimationRequest('parameter-reset');
    }
  }
}

customElements.define('parametric-panel', ParametricPanel);