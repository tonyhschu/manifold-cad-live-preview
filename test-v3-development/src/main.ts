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
function handlePipelineUpdate(data: any) {
  console.log('🎯 Handling pipeline update - this is where we would refresh models');
  // TODO: Call store functions to refresh models and re-render
}

function handlePipelineCodeUpdate(data: any) {
  console.log('🎯 Handling pipeline code update - this is where we would reload pipeline and re-render current model');
  // TODO: Reload pipeline module and regenerate current model
}

function handleManifestUpdate(data: any) {
  console.log('🎯 Handling manifest update - this is where we would refresh model list');
  // TODO: Refresh available models list
}

// Start the application
main();
