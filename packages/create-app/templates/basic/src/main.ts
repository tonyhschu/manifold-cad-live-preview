/**
 * {{projectName}} - Main Entry Point
 *
 * Uses the configurator as a library with V3 pipeline integration.
 */

import { startConfigurator } from '@manifold-studio/configurator';
import { Manifold, CrossSection } from '@manifold-studio/wrapper';

console.log('🚀 {{projectName}} Starting...');

async function main() {
  try {
    // Make Manifold available globally for pipeline models
    (globalThis as any).manifold = Manifold;
    (globalThis as any).CrossSection = CrossSection;
    console.log('✅ Manifold initialized and available globally');

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

// Start the application
main();
