#!/usr/bin/env node

/**
 * Generate Manifest Script
 * 
 * This script generates manifest.json by importing the compiled pipeline
 * and extracting the model metadata.
 */

import { writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

async function generateManifest() {
  console.log('🔍 Generating manifest.json...');

  try {
    // Path to the compiled pipeline
    const pipelinePath = resolve('./temp/pipeline.js');
    
    if (!existsSync(pipelinePath)) {
      console.error('❌ Pipeline not found at:', pipelinePath);
      console.log('💡 Make sure to run the pipeline build first: npm run build:pipeline');
      process.exit(1);
    }

    console.log('📦 Loading pipeline from:', pipelinePath);

    // Dynamic import the pipeline
    const pipelineModule = await import(pipelinePath);
    const pipeline = pipelineModule.default || pipelineModule.pipeline;
    const manifestData = pipelineModule.manifestData;

    if (!pipeline) {
      throw new Error('Pipeline module does not export a pipeline object');
    }

    console.log(`📊 Found ${pipeline.getAvailableModels().length} models`);

    // Use the pre-built manifest data from the pipeline
    if (!manifestData) {
      throw new Error('Pipeline does not export manifestData - this should not happen with V3 pipelines');
    }

    const manifest = manifestData;

    // Write manifest file
    const manifestPath = resolve('./temp/manifest.json');
    const jsonContent = JSON.stringify(manifest, null, 2);

    writeFileSync(manifestPath, jsonContent, 'utf-8');

    console.log('✅ Manifest generated:', manifestPath);
    console.log('📋 Manifest contents:');
    console.log(`   - Version: ${manifest.version}`);
    console.log(`   - Models: ${manifest.models.length}`);
    
    // Log model details
    manifest.models.forEach((model: any) => {
      const paramCount = model.config?.parameters ? Object.keys(model.config.parameters).length : 0;
      const paramInfo = paramCount > 0 ? ` (${paramCount} parameters)` : '';
      console.log(`     • ${model.name} [${model.type}]${paramInfo}`);
    });

  } catch (error) {
    console.error('❌ Failed to generate manifest:', error);
    process.exit(1);
  }
}

// Run the script (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  generateManifest();
}

export { generateManifest };
