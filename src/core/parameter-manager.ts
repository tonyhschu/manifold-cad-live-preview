import { Pane } from 'tweakpane';
import type { ParametricConfig, ParameterConfig, TweakpaneParam } from '../types/parametric-config';
import type { Manifold } from '../lib/manifold';

export class ParameterManager {
  private pane: Pane;
  private config: ParametricConfig;
  private params: Record<string, any> = {};
  // private customCleanupFunctions: (() => void)[] = []; // TODO: Issue #14

  constructor(config: ParametricConfig, container: HTMLElement) {
    this.config = config;
    this.pane = new Pane({ container });
    
    this.initializeParameters();
    this.setupUI();
    
    // Initial render with guaranteed complete parameters
    this.renderModel();
  }

  private initializeParameters(): void {
    // Extract defaults from parameter config - framework guarantee
    for (const [key, paramConfig] of Object.entries(this.config.parameters)) {
      this.params[key] = paramConfig.value;
    }
  }

  private setupUI(): void {
    for (const [key, paramConfig] of Object.entries(this.config.parameters)) {
      // Custom parameters not yet implemented - see Issue #14
      // if (this.isCustomParam(paramConfig)) {
      //   this.setupCustomParameter(key, paramConfig);
      // } else {
      this.setupTweakpaneParameter(key, paramConfig as TweakpaneParam);
      // }
    }
  }

  // Custom parameter methods - NOT YET IMPLEMENTED
  // See Issue #14: https://github.com/tonyhschu/manifold-cad-live-preview/issues/14
  /*
  private isCustomParam(param: ParameterConfig): param is CustomParam {
    return 'type' in param && param.type === 'custom';
  }
  */

  private setupTweakpaneParameter(key: string, paramConfig: TweakpaneParam): void {
    try {
      // Convert our parameter config to Tweakpane's expected format
      const tweakpaneConfig: any = { ...paramConfig };
      delete tweakpaneConfig.value; // Remove value from config since it's in this.params
      
      // Cast to any to bypass TypeScript issues for now
      const binding = (this.pane as any).addBinding(this.params, key, tweakpaneConfig);
      
      binding.on('change', () => {
        this.renderModel();
      });
    } catch (error) {
      console.error(`Failed to setup parameter ${key}:`, error);
      console.log('Parameter value:', this.params[key]);
      console.log('Parameter config:', paramConfig);
      throw error;
    }
  }

  // Custom parameter setup - NOT YET IMPLEMENTED  
  // See Issue #14: https://github.com/tonyhschu/manifold-cad-live-preview/issues/14
  /*
  private setupCustomParameter(key: string, paramConfig: CustomParam): void {
    // Create container for custom component
    const folder = (this.pane as any).addFolder({ title: key });
    const container = document.createElement('div');
    container.className = 'custom-parameter-container';
    
    // Add container to Tweakpane folder
    const element = folder.element;
    element.appendChild(container);

    try {
      // Setup custom component with cleanup tracking
      const cleanup = paramConfig.setup(
        container,
        this.params[key],
        (newValue: any) => {
          this.params[key] = newValue;
          this.renderModel();
        }
      );

      if (cleanup) {
        this.customCleanupFunctions.push(cleanup);
      }
    } catch (error) {
      console.warn(`Custom parameter '${key}' setup failed:`, error);
      
      // Fall back to standard parameter if available
      if (paramConfig.fallback) {
        console.info(`Using fallback parameter for '${key}'`);
        element.removeChild(container);
        this.setupTweakpaneParameter(key, paramConfig.fallback);
      } else {
        // Show error message in UI
        container.innerHTML = `<div style="color: red; padding: 8px;">Custom parameter '${key}' failed to load</div>`;
      }
    }
  }
  */

  private renderModel(): void {
    try {
      // Framework guarantee: generateModel called with complete parameter object
      const manifold = this.config.generateModel(this.params);
      
      // Emit event for external listeners (e.g., 3D viewer)
      const event = new CustomEvent('modelGenerated', { 
        detail: { manifold, params: { ...this.params } }
      });
      document.dispatchEvent(event);
      
    } catch (error) {
      console.error('Model generation failed:', error);
      
      // Emit error event
      const errorEvent = new CustomEvent('modelGenerationError', {
        detail: { error, params: { ...this.params } }
      });
      document.dispatchEvent(errorEvent);
    }
  }

  // Public API
  getParameters(): Record<string, any> {
    return { ...this.params };
  }

  setParameter(key: string, value: any): void {
    if (key in this.params) {
      this.params[key] = value;
      this.renderModel();
      // TODO: Update UI to reflect programmatic changes
    } else {
      console.warn(`Parameter '${key}' does not exist in config`);
    }
  }

  regenerateModel(): Manifold {
    return this.config.generateModel(this.params);
  }

  destroy(): void {
    // Clean up custom components (when Issue #14 is implemented)
    // this.customCleanupFunctions.forEach(cleanup => {
    //   try {
    //     cleanup();
    //   } catch (error) {
    //     console.warn('Error during custom parameter cleanup:', error);
    //   }
    // });
    // this.customCleanupFunctions = [];

    // Dispose Tweakpane
    this.pane.dispose();
  }
}