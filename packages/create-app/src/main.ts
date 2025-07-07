/**
 * Create-App Development Environment - Main Entry Point
 *
 * Uses the configurator as a library with V3 pipeline integration.
 * This environment is used for developing the configurator package.
 */

import { startConfigurator } from '@manifold-studio/configurator';
import { Manifold, CrossSection } from '@manifold-studio/wrapper';

console.log('🚀 Create-App Development Environment Starting...');

async function main() {
  try {
    // Make Manifold available globally for pipeline models
    (globalThis as any).manifold = Manifold;
    (globalThis as any).CrossSection = CrossSection;
    console.log('✅ Manifold initialized and available globally');

    // Test pipeline availability first
    console.log('🔍 Testing pipeline availability...');
    try {
      const pipelineResponse = await fetch('/temp/pipeline.js');
      console.log('📦 Pipeline response status:', pipelineResponse.status);
      if (!pipelineResponse.ok) {
        throw new Error(`Pipeline not available: ${pipelineResponse.status}`);
      }
    } catch (pipelineError) {
      console.error('❌ Pipeline test failed:', pipelineError);
      throw new Error(`Pipeline not available: ${pipelineError.message}`);
    }

    // Start the configurator with V3 pipeline support
    console.log('🎯 Starting V3 Configurator...');

    const configurator = await startConfigurator({
      container: '#app',
      defaultModel: 'main',
      useV3Pipeline: true,
      pipelinePath: '/temp/pipeline.js'
    });

    console.log('✅ V3 Configurator started successfully!');
    console.log('Configurator instance:', configurator);

  } catch (error) {
    console.error('❌ Failed to start V3 Configurator:', error);
    
    // Show error in UI
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #d32f2f;">
          <h2>❌ Failed to Start V3 Configurator</h2>
          <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
          <p><strong>Make sure the pipeline build server is running:</strong></p>
          <code>npm run dev:pipeline</code>
          <p>Or build the pipeline once:</p>
          <code>npm run build:pipeline</code>
        </div>
      `;
    }
  }
}

// Set up custom Pipeline HMR
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
async function handlePipelineUpdate(data: any) {
  try {
    // Import store functions dynamically to avoid circular dependencies
    const { store } = await import('@manifold-studio/configurator');

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

async function handlePipelineCodeUpdate(_data: any) {
  // Set global timestamp to trigger HMR detection in ModelViewer
  (globalThis as any).__MODEL_REBUILD_TIMESTAMP__ = Date.now();

  try {
    // Import configurator functions
    const { store, getModelService } = await import('@manifold-studio/configurator');

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

async function handleManifestUpdate(_data: any) {
  try {
    // Import store functions
    const { store } = await import('@manifold-studio/configurator');

    // Refresh available models list
    await store.refreshAvailableModels();
  } catch (error) {
    console.error('Failed to handle manifest update:', error);
  }
}

// Start the application
main();
