// Main library entry point for @manifold-studio/configurator
// This file exports the public API for use in generated projects

import './style.css'; // Import CSS for HMR support
import './components'; // Register all web components
import { initializeServices } from './services';
import { createModelViewer } from './core/preview';
import * as storeExports from './state/store';

export interface ConfiguratorOptions {
  models?: Record<string, any>;
  defaultModel?: string;
  container?: string | HTMLElement;
  /** Use V3 pipeline system instead of legacy model discovery */
  useV3Pipeline?: boolean;
  /** Pipeline path for V3 system */
  pipelinePath?: string;
  /** Custom model registry for user projects - maps model ID to actual model objects */
  modelRegistry?: Record<string, {
    id: string;
    name: string;
    type: 'static' | 'parametric';
    loader: () => Promise<any>; // Function that returns the actual model/config
  }>;
}

/**
 * Create the HTML structure for the configurator
 */
function createConfiguratorHTML(): string {
  return `
      <header id="toolbar">
        Hello

        <!-- Download Panel Component -->
        <download-panel></download-panel>
      </header>

      <section id="sidebar">
        <!-- Model Selector Component -->
        <model-selector></model-selector>

        <!-- Model Metadata Component -->
        <model-metadata></model-metadata>

        <parametric-panel></parametric-panel>
      </section>

      <section id="main">
        <div id="viewer-container">
          <model-viewer-wrapper>
            <model-viewer id="viewer"
              camera-controls
              shadow-intensity="1"
              tone-mapping="neutral"
              environment-image="neutral"
              skybox-image=""
              interaction-prompt="none"
              rotations-per-second="0rad"
              auto-rotate-delay="Infinity"
              auto-rotate="false"
              alt="3D model"
              style="width: 100%; height: 100%; background-color: #f5f5f5;"
            ></model-viewer>
          </model-viewer-wrapper>
        </div>

        <!-- Status Bar Component -->
        <status-bar>
          <div id="status">Loading...</div>
        </status-bar>
      </section>
  `;
}



/**
 * Load the model-viewer web component if not already loaded
 */
function loadModelViewerScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if model-viewer is already loaded
    if (customElements.get('model-viewer')) {
      resolve();
      return;
    }

    // Check if script is already in the document
    const existingScript = document.querySelector('script[src*="model-viewer"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', reject);
      return;
    }

    // Load the script
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js';
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Initialize V3 Pipeline System
 */
async function initializeV3(pipelinePath: string = '/temp/pipeline.js') {
  console.log("🔧 Initializing V3 Pipeline System...");

  // Initialize all services first (including ExportService, UrlService)
  initializeServices();

  // Initialize V3 model service
  const { createV3ModelService } = await import('./services/V3ModelService.js');
  const v3ModelService = createV3ModelService(pipelinePath);
  await v3ModelService.initialize();

  // Replace only the model service with V3 service
  const { setModelService } = await import('./services');
  setModelService(v3ModelService);

  console.log("✅ V3 Pipeline System initialized");
}

/**
 * Initialize the V3 configurator
 */
async function initializeConfigurator(pipelinePath?: string) {
  // V3 Pipeline Mode (only supported mode)
  console.log('🚀 Initializing V3 Pipeline Configurator...');
  await initializeV3(pipelinePath);

  // Initialize V3 state bridge for UI components
  const { initializeV3StateBridge } = await import('./state/v3-bridge');
  await initializeV3StateBridge();
  console.log('✅ V3 state bridge initialized');

  // Get DOM elements
  const modelViewerElement = document.getElementById("viewer") as any;

  // Create the model viewer controller
  const modelViewer = createModelViewer({
    modelViewer: modelViewerElement
  });

  // Set up model viewer event handlers
  if (modelViewerElement) {
    // Model loaded event
    modelViewerElement.addEventListener('load', () => {
      console.log('Model viewer: Model loaded');
    });

    // Error handling
    modelViewerElement.addEventListener('error', (error: any) => {
      console.error('Model viewer error:', error);
    });
  }

  return { modelViewer };
}

/**
 * Start the Manifold Studio configurator
 */
export async function startConfigurator(options: ConfiguratorOptions = {}) {
  const {
    models = {},
    defaultModel,
    container = 'body',
    modelRegistry,
    pipelinePath = '/temp/pipeline.js'
  } = options;

  // Get or create container element
  let containerElement: HTMLElement;
  if (typeof container === 'string') {
    containerElement = document.querySelector(container) as HTMLElement;
    if (!containerElement) {
      throw new Error(`Container element "${container}" not found`);
    }
  } else {
    containerElement = container;
  }

  // CSS styles are now imported via CSS file (style.css) for HMR support
  // No need to inject CSS - Vite handles CSS imports

  // Load model-viewer script
  await loadModelViewerScript();

  // Set the container as the app element
  containerElement.id = 'app';

  // Inject the HTML structure
  containerElement.innerHTML = createConfiguratorHTML();

  // Wait for DOM to be ready
  await new Promise(resolve => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve(undefined);
    }
  });

  // Initialize the configurator
  const { modelViewer } = await initializeConfigurator(pipelinePath);

  // Set up custom model registry if provided
  if (modelRegistry) {
    console.log('🔍 Using custom model registry');
    const { configureModelDiscovery } = await import('./core/model-loader');

    // Convert model registry to the format expected by the configurator
    const registryModels = Object.values(modelRegistry).map(model => ({
      id: model.id,
      name: model.name,
      type: model.type,
      path: model.id, // Use ID as path since we have the loader function
      loader: model.loader
    }));

    console.log('🎯 Custom registry has models:', registryModels.map(m => m.id));
    configureModelDiscovery({ customModels: registryModels });

    // Refresh the store with the new models
    const { refreshAvailableModels } = await import('./state/store');
    await refreshAvailableModels();
    console.log('✅ Store updated with custom models');
  }

  // Register models if provided (for future enhancement)
  if (Object.keys(models).length > 0) {
    console.log('Custom models provided:', Object.keys(models));
  }

  // Load default model using V3 system
  try {
    const { getModelService } = await import('./services');
    const modelService = getModelService();

    // Check if there's a model in the URL first (V3 UIStateManager handles this)
    const url = new URL(window.location.href);
    const urlModel = url.searchParams.get('m_model');

    if (urlModel) {
      console.log('🔗 Loading model from URL (V3):', urlModel);
      await modelService.loadModel(urlModel);
      console.log('✅ Model loaded from URL via V3 system');
    } else if (defaultModel) {
      console.log('🎯 Loading default model (V3):', defaultModel);
      await modelService.loadModel(defaultModel);
      console.log('✅ Default model loaded via V3 system');
    } else {
      // Load first available model
      const models = modelService.getAvailableModels();
      if (models.length > 0) {
        console.log('🎯 Loading first available model (V3):', models[0].id);
        await modelService.loadModel(models[0].id);
        console.log('✅ First available model loaded via V3 system');
      }
    }
    console.log('Configurator started successfully');
  } catch (error) {
    console.error('Failed to load default model:', error);
    storeExports.updateStatus('Failed to load model', true);
  }

  return {
    modelViewer,
    store: storeExports
  };
}

// Re-export useful types and utilities
export { getModelService, getExportService } from './services';
export * as store from './state/store';
