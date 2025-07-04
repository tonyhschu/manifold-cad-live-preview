// Main library entry point for @manifold-studio/configurator
// This file exports the public API for use in generated projects

import './components'; // Register all web components
import { initializeServices } from './services';
import { loadDefaultModel } from './core/model-loader';
import { initializeStore, loadModel } from './state/store';
import { createModelViewer } from './core/preview';
import { setupSimpleHMR } from './hmr-simple';
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
      <section id="context">
        <section aria-label="metadata">
          <h1>Module Name</h1>
          <div>
            <p>Module Description</p>
          </div>
        </section>

        <!-- Model Selector Component -->
        <model-selector></model-selector>

        <!-- Download Panel Component -->
        <download-panel></download-panel>

        <section id="layers">
          Array of layers and/or model structure goes here.
        </section>
      </section>

      <section id="canvas">
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

      <section id="config">
        <!-- Parametric Controls Panel -->
        <parametric-panel></parametric-panel>
      </section>
  `;
}

/**
 * Inject CSS styles into the document head
 */
function injectCSS() {
  // Check if styles are already injected
  if (document.querySelector('#manifold-configurator-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'manifold-configurator-styles';
  style.textContent = `
    :root {
      font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      font-weight: 400;
    }

    body {
      margin: 0;
      min-width: 320px;
      min-height: 100vh;
    }

    #app {
      margin: 0;
      padding: 0;
      width: 100%;
      display: grid;
      grid-template-columns: 20rem 1fr 20rem;
      grid-template-rows: 100vh;
      gap: 1rem;
    }

    #context,
    #canvas,
    #config {
      padding: 1rem;
      overflow-y: auto;
    }

    #context {
      border-right: 1px solid #eaeaea;
    }

    #config {
      border-left: 1px solid #eaeaea;
    }

    #viewer-container {
      width: 100%;
      height: calc(100vh - 100px);
      margin-top: 0;
      margin-bottom: 0;
      border: 1px solid #ccc;
      border-radius: 8px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    model-viewer {
      width: 100%;
      height: 100%;
      background-color: #f5f5f5;
    }

    /* Additional essential styles */
    .manifold-configurator * {
      box-sizing: border-box;
    }
  `;

  document.head.appendChild(style);
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
 * Initialize the configurator (V1/V2 legacy or V3 pipeline)
 */
async function initializeConfigurator(useV3Pipeline: boolean = false, pipelinePath?: string) {
  if (useV3Pipeline) {
    // V3 Pipeline Mode
    console.log('🚀 Initializing V3 Pipeline Configurator...');
    await initializeV3(pipelinePath);

    // Initialize store with V3 models
    await initializeStore();
  } else {
    // Legacy V1/V2 Mode
    console.log('🚀 Initializing Legacy Configurator...');

    // Initialize store
    await initializeStore();

    // Initialize services
    initializeServices();

    // Set up HMR if available
    setupSimpleHMR();

    // V3 uses custom HMR events instead of temp folder polling
    console.log('✅ V3 HMR: Using custom events instead of polling');
  }

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
    useV3Pipeline = false,
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

  // Inject CSS styles first
  injectCSS();

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
  const { modelViewer } = await initializeConfigurator(useV3Pipeline, pipelinePath);

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

  // Load default model
  try {
    if (defaultModel) {
      await loadModel(defaultModel);
    } else {
      await loadDefaultModel();
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
