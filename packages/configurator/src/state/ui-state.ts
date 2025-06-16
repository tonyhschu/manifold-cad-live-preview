/**
 * UI State Management
 * 
 * Handles state preservation across pipeline reloads for V3 architecture.
 * State survives pipeline updates via URL params and localStorage.
 */

/**
 * UI state interface
 * Defines all state that should be preserved across pipeline reloads
 */
export interface UIState {
  /** Currently selected model ID */
  selectedModel: string | null;
  /** Parameters for the current model (if parametric) */
  parameters: Record<string, any>;
  /** Camera position in 3D space */
  cameraPosition: [number, number, number];
  /** Camera target/look-at point */
  cameraTarget: [number, number, number];
  /** Camera zoom level */
  cameraZoom: number;
  /** UI panel states */
  panels: {
    modelList: boolean;
    parameters: boolean;
    export: boolean;
  };
  /** Last pipeline version seen */
  pipelineVersion?: string;
}

/**
 * Default UI state
 */
const DEFAULT_STATE: UIState = {
  selectedModel: null,
  parameters: {},
  cameraPosition: [5, 5, 5],
  cameraTarget: [0, 0, 0],
  cameraZoom: 1,
  panels: {
    modelList: true,
    parameters: true,
    export: false
  }
};

/**
 * UI State Manager
 * 
 * Manages UI state persistence across pipeline reloads.
 * Uses both URL parameters and localStorage for different types of state.
 */
export class UIStateManager {
  private state: UIState = { ...DEFAULT_STATE };
  private listeners: Array<(state: UIState) => void> = [];

  constructor() {
    this.loadState();
  }

  /**
   * Get current state
   */
  getState(): UIState {
    return { ...this.state };
  }

  /**
   * Update state and persist
   */
  setState(updates: Partial<UIState>): void {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    console.log('🔄 UI state updated:', updates);
    
    // Persist state
    this.saveState();
    
    // Notify listeners
    this.notifyListeners(oldState);
  }

  /**
   * Update specific model parameters
   */
  setParameters(parameters: Record<string, any>): void {
    this.setState({ parameters });
  }

  /**
   * Update camera state
   */
  setCameraState(position: [number, number, number], target: [number, number, number], zoom: number): void {
    this.setState({
      cameraPosition: position,
      cameraTarget: target,
      cameraZoom: zoom
    });
  }

  /**
   * Update panel visibility
   */
  setPanelState(panel: keyof UIState['panels'], visible: boolean): void {
    this.setState({
      panels: {
        ...this.state.panels,
        [panel]: visible
      }
    });
  }

  /**
   * Select a model
   */
  selectModel(modelId: string | null, parameters?: Record<string, any>): void {
    this.setState({
      selectedModel: modelId,
      parameters: parameters || {}
    });
  }

  /**
   * Save state to URL and localStorage
   */
  private saveState(): void {
    try {
      // Save critical state to URL (for sharing/bookmarking)
      this.saveToUrl();
      
      // Save full state to localStorage (for session persistence)
      this.saveToLocalStorage();
      
    } catch (error) {
      console.warn('Failed to save UI state:', error);
    }
  }

  /**
   * Save critical state to URL parameters
   */
  private saveToUrl(): void {
    const url = new URL(window.location.href);
    
    // Clear existing manifold params
    const paramsToRemove = [];
    for (const [key] of url.searchParams) {
      if (key.startsWith('m_')) {
        paramsToRemove.push(key);
      }
    }
    paramsToRemove.forEach(key => url.searchParams.delete(key));
    
    // Add current state to URL
    if (this.state.selectedModel) {
      url.searchParams.set('m_model', this.state.selectedModel);
    }
    
    // Add parameters if any
    if (Object.keys(this.state.parameters).length > 0) {
      url.searchParams.set('m_params', JSON.stringify(this.state.parameters));
    }
    
    // Update URL without page reload
    window.history.replaceState({}, '', url.toString());
  }

  /**
   * Save full state to localStorage
   */
  private saveToLocalStorage(): void {
    const stateToSave = {
      ...this.state,
      // Add timestamp for debugging
      savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('manifold-ui-state', JSON.stringify(stateToSave));
  }

  /**
   * Load state from URL and localStorage
   */
  private loadState(): void {
    try {
      // Load from localStorage first (full state)
      this.loadFromLocalStorage();
      
      // Override with URL parameters (for sharing)
      this.loadFromUrl();
      
      console.log('✅ UI state loaded:', this.state);
      
    } catch (error) {
      console.warn('Failed to load UI state, using defaults:', error);
      this.state = { ...DEFAULT_STATE };
    }
  }

  /**
   * Load state from URL parameters
   */
  private loadFromUrl(): void {
    const url = new URL(window.location.href);
    
    // Load selected model
    const modelFromUrl = url.searchParams.get('m_model');
    if (modelFromUrl) {
      this.state.selectedModel = modelFromUrl;
    }
    
    // Load parameters
    const paramsFromUrl = url.searchParams.get('m_params');
    if (paramsFromUrl) {
      try {
        this.state.parameters = JSON.parse(paramsFromUrl);
      } catch (error) {
        console.warn('Failed to parse parameters from URL:', error);
      }
    }
  }

  /**
   * Load state from localStorage
   */
  private loadFromLocalStorage(): void {
    const savedState = localStorage.getItem('manifold-ui-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Merge with defaults to handle version changes
        this.state = { ...DEFAULT_STATE, ...parsed };
      } catch (error) {
        console.warn('Failed to parse saved state:', error);
      }
    }
  }

  /**
   * Add state change listener
   */
  addListener(listener: (state: UIState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(oldState: UIState): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('State listener error:', error);
      }
    });
  }

  /**
   * Reset state to defaults
   */
  reset(): void {
    this.state = { ...DEFAULT_STATE };
    this.saveState();
    this.notifyListeners(this.state);
    console.log('🔄 UI state reset to defaults');
  }

  /**
   * Handle pipeline reload
   * Preserves compatible state, resets incompatible state
   */
  handlePipelineReload(newPipelineVersion?: string): void {
    console.log('🔄 Handling pipeline reload...');
    
    // Update pipeline version
    if (newPipelineVersion) {
      this.setState({ pipelineVersion: newPipelineVersion });
    }
    
    // Note: We preserve selectedModel and parameters
    // The UI will validate if they're still compatible with the new pipeline
    
    console.log('✅ Pipeline reload handled, state preserved');
  }
}
