/**
 * V3 Development Test - Main Entry Point
 *
 * Uses the configurator as a library with V3 pipeline integration.
 */

import { startConfigurator } from '@manifold-studio/configurator';
import { Manifold, CrossSection } from '@manifold-studio/wrapper';

console.log('🚀 V3 Development Test Starting...');

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
          <code>npm run build:pipeline</code>
          <details style="margin-top: 1rem; text-align: left;">
            <summary>Error Details</summary>
            <pre style="background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow: auto;">
${error instanceof Error ? error.stack : error}
            </pre>
          </details>
        </div>
      `;
    }
  }
}

// Set up custom Pipeline HMR
if (import.meta.hot) {
  console.log('🔥 Setting up custom Pipeline HMR...');

  // Listen for our custom pipeline events
  import.meta.hot.on('pipeline:updated', (data) => {
    console.log('🔄 Pipeline updated:', data);
    handlePipelineUpdate(data);
  });

  import.meta.hot.on('pipeline:code-updated', (data) => {
    console.log('📦 Pipeline code updated:', data);
    handlePipelineCodeUpdate(data);
  });

  import.meta.hot.on('pipeline:manifest-updated', (data) => {
    console.log('📋 Pipeline manifest updated:', data);
    handleManifestUpdate(data);
  });
} else {
  console.log('❌ HMR not available');
}

// HMR event handlers
async function handlePipelineUpdate(data: any) {
  console.group('[HMR-MANIFEST] 🎯 Pipeline Update');
  console.log('[HMR-MANIFEST] Handling pipeline update - refreshing models and regenerating GLB');
  try {
    // Import store functions dynamically to avoid circular dependencies
    const { store } = await import('@manifold-studio/configurator');

    // Refresh available models list
    await store.refreshAvailableModels();
    console.log('[HMR-MANIFEST] ✅ Available models refreshed');

    // Regenerate current model if one is selected
    const currentModel = store.currentModelId.value;
    if (currentModel) {
      console.log(`[HMR-MANIFEST] 🔄 Regenerating GLB for current model: ${currentModel}`);
      await store.loadModel(currentModel);
      console.log('[HMR-MANIFEST] ✅ GLB regenerated successfully');
    }
  } catch (error) {
    console.error('[HMR-MANIFEST] ❌ Failed to handle pipeline update:', error);
  }
  console.groupEnd();
}

async function handlePipelineCodeUpdate(data: any) {
  console.group('[HMR-PIPELINE] 🎯 Pipeline Code Update');
  console.log('[HMR-PIPELINE] Handling pipeline code update - reloading pipeline and regenerating GLB');

  // Set global timestamp to trigger HMR detection in ModelViewer
  (globalThis as any).__MODEL_REBUILD_TIMESTAMP__ = Date.now();

  // Visual feedback
  document.title = '🔄 Reloading pipeline...';

  try {
    // Import configurator functions
    const { store, getModelService } = await import('@manifold-studio/configurator');

    // FORCE RELOAD THE PIPELINE MODULE FIRST
    console.log('[HMR-PIPELINE] 🔄 Force reloading pipeline module...');
    const modelService = getModelService();

    console.log('[HMR-PIPELINE] 🔍 Model service object:', modelService);
    console.log('[HMR-PIPELINE] 🔍 Model service type:', typeof modelService);
    console.log('[HMR-PIPELINE] 🔍 Available methods:', Object.keys(modelService || {}));
    console.log('[HMR-PIPELINE] 🔍 reloadPipeline method:', typeof modelService?.reloadPipeline);

    if (modelService && typeof modelService.reloadPipeline === 'function') {
      await modelService.reloadPipeline();
      console.log('[HMR-PIPELINE] ✅ Pipeline module reloaded successfully');
    } else {
      console.warn('[HMR-PIPELINE] ⚠️ Could not access pipeline reload method on model service');
    }

    document.title = '🔄 Regenerating GLB...';

    // Now regenerate current model with NEW pipeline
    const currentModel = store.currentModelId.value;
    if (currentModel) {
      console.log(`[HMR-PIPELINE] 🔄 Regenerating GLB for model: ${currentModel} with new pipeline`);
      await store.loadModel(currentModel);
      console.log('[HMR-PIPELINE] ✅ GLB regenerated successfully');

      document.title = '✅ GLB Regenerated!';

      // Reset title after a moment
      setTimeout(() => {
        document.title = 'V3 Development Test';
      }, 2000);
    } else {
      console.log('[HMR-PIPELINE] ℹ️ No current model selected, skipping GLB regeneration');
      document.title = 'ℹ️ No model selected';
      setTimeout(() => {
        document.title = 'V3 Development Test';
      }, 2000);
    }
  } catch (error) {
    console.error('[HMR-PIPELINE] ❌ Failed to handle pipeline code update:', error);
    document.title = '❌ Pipeline reload failed';
    setTimeout(() => {
      document.title = 'V3 Development Test';
    }, 3000);
  }

  console.groupEnd();
}

async function handleManifestUpdate(data: any) {
  console.group('[HMR-MANIFEST] 🎯 Manifest Update');
  console.log('[HMR-MANIFEST] Handling manifest update - refreshing model list');
  try {
    // Import store functions
    const { store } = await import('@manifold-studio/configurator');

    // Refresh available models list
    await store.refreshAvailableModels();
    console.log('[HMR-MANIFEST] ✅ Model list refreshed');
  } catch (error) {
    console.error('[HMR-MANIFEST] ❌ Failed to handle manifest update:', error);
  }
  console.groupEnd();
}

// Start the application
main();
