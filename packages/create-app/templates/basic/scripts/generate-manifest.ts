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

    // Import the pipeline with cache busting
    const timestamp = Date.now();
    const random = Math.random();
    const moduleUrl = `${pipelinePath}?t=${timestamp}&r=${random}`;
    
    console.log('📦 Loading pipeline from:', pipelinePath);
    console.log('🔄 Cache busting URL:', moduleUrl);
    
    // Dynamic import the pipeline
    const pipelineModule = await import(moduleUrl);
    const pipeline = pipelineModule.default || pipelineModule.pipeline;
    
    if (!pipeline) {
      throw new Error('Pipeline module does not export a pipeline object');
    }

    // Validate pipeline interface
    if (typeof pipeline.getAvailableModels !== 'function' ||
        typeof pipeline.generateModel !== 'function' ||
        typeof pipeline.getModelConfig !== 'function') {
      throw new Error('Pipeline does not implement required interface');
    }

    // Check if pipeline has pre-built manifest data (V3 approach)
    const manifestData = (pipelineModule as any).manifestData;

    let manifest;
    if (manifestData) {
      console.log('📦 Using pre-built manifest data from pipeline');
      manifest = manifestData;
    } else {
      console.log('🔧 Building manifest data from pipeline methods (fallback)');
      // Fallback to building manifest from pipeline methods
      const pipelineInfo = pipeline.getPipelineInfo?.() || {};
      const availableModels = pipeline.getAvailableModels();

      console.log(`📊 Found ${availableModels.length} models`);

      manifest = {
        version: pipelineInfo.version || Date.now().toString(),
        generatedAt: pipelineInfo.generatedAt || new Date().toISOString(),
        models: availableModels.map((model: any) => {
          const baseModel = {
            id: model.id,
            name: model.name || model.id,
            type: model.type || 'static'
          };

          // Add parameter configuration for parametric models
          if (model.type === 'parametric') {
            const config = pipeline.getModelConfig(model.id);
            if (config) {
              return {
                ...baseModel,
                config: {
                  parameters: config.parameters || {},
                  description: config.description || `Parametric model: ${baseModel.name}`
                }
              };
            }
          }

          return {
            ...baseModel,
            description: `${model.type === 'static' ? 'Static' : 'Parametric'} model: ${baseModel.name}`
          };
        })
      };
    }

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
