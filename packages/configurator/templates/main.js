/**
 * Manifold Studio Configurator Initialization
 * 
 * This script is served by the CLI and automatically initializes the configurator
 * with the appropriate configuration for the user's project.
 */

// Dynamic imports will be injected by the CLI based on development mode
// In dev mode: uses source imports for HMR
// In production mode: uses package imports
const CONFIGURATOR_IMPORT = '{{CONFIGURATOR_IMPORT}}';
const PIPELINE_PATH = '{{PIPELINE_PATH}}';
const MANIFEST_PATH = '{{MANIFEST_PATH}}';

console.log('🚀 Manifold Studio Starting...');
console.log('📍 Import paths:', {
  configurator: CONFIGURATOR_IMPORT,
  wrapper: '{{WRAPPER_IMPORT}}',
  pipeline: PIPELINE_PATH,
  manifest: MANIFEST_PATH
});

async function main() {
  try {
    console.log('🔄 Step 1: Testing imports...');

    // Test wrapper import first
    console.log('📦 Testing wrapper import...');
    try {
      const wrapperModule = await import('{{WRAPPER_IMPORT}}');
      console.log('✅ Wrapper imported successfully!');
      console.log('📋 Available exports:', Object.keys(wrapperModule));

      const { Manifold, CrossSection } = wrapperModule;
      if (!Manifold) {
        throw new Error('Manifold not found in wrapper exports');
      }

      globalThis.manifold = Manifold;
      globalThis.CrossSection = CrossSection;
      console.log('✅ Manifold initialized and available globally');
    } catch (wrapperError) {
      console.error('❌ Wrapper import failed:', wrapperError);
      throw wrapperError;
    }

    console.log('🔄 Step 2: Testing pipeline availability...');
    // Test pipeline availability first
    try {
      const pipelineResponse = await fetch(PIPELINE_PATH);
      console.log('📦 Pipeline response status:', pipelineResponse.status);
      if (!pipelineResponse.ok) {
        throw new Error(`Pipeline not available: ${pipelineResponse.status}`);
      }
    } catch (pipelineError) {
      console.error('❌ Pipeline test failed:', pipelineError);
      throw new Error(`Pipeline not available: ${pipelineError.message}`);
    }

    console.log('🔄 Step 3: Loading configurator...');
    // Start the configurator with V3 pipeline support
    console.log('🎯 Starting V3 Configurator...');

    // Test configurator import
    console.log('📦 Testing configurator import from:', CONFIGURATOR_IMPORT);
    let startConfigurator;
    try {
      const configuratorModule = await import(CONFIGURATOR_IMPORT);
      console.log('✅ Configurator imported:', Object.keys(configuratorModule));
      startConfigurator = configuratorModule.startConfigurator;
      console.log('✅ startConfigurator function found:', typeof startConfigurator);

      if (!startConfigurator) {
        throw new Error('startConfigurator function not found in configurator module');
      }
    } catch (configuratorError) {
      console.error('❌ Configurator import failed:', configuratorError);
      throw configuratorError;
    }

    const configurator = await startConfigurator({
      container: '#app',
      defaultModel: 'main',
      useV3Pipeline: true,
      pipelinePath: PIPELINE_PATH
    });

    console.log('✅ V3 Configurator started successfully!');
    console.log('Configurator instance:', configurator);

  } catch (error) {
    console.error('❌ Failed to start V3 Configurator:', error);

    // Show error in UI
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #d32f2f; font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>❌ Failed to Start V3 Configurator</h2>
          <p style="color: #666; margin: 1rem 0;">${error instanceof Error ? error.message : 'Unknown error'}</p>
          <p><strong>Make sure the pipeline build server is running:</strong></p>
          <code style="background: #f5f5f5; padding: 0.5rem; border-radius: 4px;">npm run dev</code>
          <details style="margin-top: 1rem; text-align: left;">
            <summary style="cursor: pointer; font-weight: bold;">Error Details</summary>
            <pre style="background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow: auto; font-size: 0.9em; margin-top: 0.5rem;">
${error instanceof Error ? error.stack : error}
            </pre>
          </details>
        </div>
      `;
    }
  }
}

// Set up custom Pipeline HMR (will be active in development mode)
if (import.meta.hot) {
  // Listen for our custom pipeline events
  import.meta.hot.on('pipeline:updated', (data) => {
    handlePipelineUpdate(data);
  });

  import.meta.hot.on('pipeline:code-updated', (data) => {
    handlePipelineCodeUpdate(data);
  });

  import.meta.hot.on('pipeline:manifest-updated', (data) => {
    handleManifestUpdate(data);
  });
}

// HMR event handlers
async function handlePipelineUpdate(data) {
  try {
    // Import store functions dynamically to avoid circular dependencies
    const { store } = await import(CONFIGURATOR_IMPORT);

    // Refresh available models list
    await store.refreshAvailableModels();

    // Regenerate current model if one is selected
    const currentModel = store.currentModelId.value;
    if (currentModel) {
      await store.loadModel(currentModel);
    }
  } catch (error) {
    console.error('Failed to handle pipeline update:', error);
  }
}

async function handlePipelineCodeUpdate(_data) {
  // Set global timestamp to trigger HMR detection in ModelViewer
  globalThis.__MODEL_REBUILD_TIMESTAMP__ = Date.now();

  try {
    // Import configurator functions
    const { store, getModelService } = await import(CONFIGURATOR_IMPORT);

    // Force reload the pipeline module first
    const modelService = getModelService();
    if (modelService && typeof modelService.reloadPipeline === 'function') {
      await modelService.reloadPipeline();
    }

    // Regenerate current model with new pipeline
    const currentModel = store.currentModelId.value;
    if (currentModel) {
      await store.loadModel(currentModel);
    }
  } catch (error) {
    console.error('Failed to handle pipeline code update:', error);
  }
}

async function handleManifestUpdate(_data) {
  try {
    // Import store functions
    const { store } = await import(CONFIGURATOR_IMPORT);

    // Refresh available models list
    await store.refreshAvailableModels();
  } catch (error) {
    console.error('Failed to handle manifest update:', error);
  }
}

// Start the application
main();
