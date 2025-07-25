#!/usr/bin/env node

/**
 * Test script to verify font loading works in Node.js CLI environment
 * This tests the pipeline generation and execution directly
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testFontLoading() {
  console.log('🧪 Testing font loading in Node.js CLI environment...');
  
  try {
    // Load the generated pipeline
    const pipelinePath = join(__dirname, 'temp', 'pipeline.js');
    console.log('📂 Loading pipeline from:', pipelinePath);
    
    const { default: pipeline } = await import(pipelinePath);
    console.log('✅ Pipeline loaded successfully');
    
    // Get available models
    const models = pipeline.getAvailableModels();
    console.log('📋 Available models:', models.map(m => m.id));
    
    // Find our font-test model
    const fontTestModel = models.find(m => m.id === 'components/font-test');
    if (!fontTestModel) {
      throw new Error('Font test model not found in pipeline');
    }
    
    console.log('🎯 Found font-test model:', fontTestModel);
    
    // Test parameters
    const testParams = {
      text: 'HELLO',
      font: 'NonExistentFont',  // Test hard failure
      fontSize: 18,
      height: 4
    };
    
    console.log('🔧 Testing with parameters:', testParams);
    
    // Generate the model
    console.log('⚙️ Generating model...');
    const startTime = Date.now();
    
    const result = await pipeline.generateModel('components/font-test', testParams);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Model generated successfully in ${duration}ms`);
    
    // Check if result is a valid Manifold
    if (result && typeof result === 'object') {
      console.log('📐 Result type:', typeof result);
      console.log('📊 Result properties:', Object.keys(result));
      
      // Try to get some basic info about the generated geometry
      if (typeof result.numVert === 'function') {
        console.log('🔺 Vertices:', result.numVert());
      }
      if (typeof result.numTri === 'function') {
        console.log('🔺 Triangles:', result.numTri());
      }
      if (typeof result.boundingBox === 'function') {
        const bbox = result.boundingBox();
        console.log('📦 Bounding box:', bbox);
      }
    }
    
    console.log('🎉 Font loading test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Font loading test failed:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
testFontLoading()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
