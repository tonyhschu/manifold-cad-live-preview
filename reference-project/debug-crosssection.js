#!/usr/bin/env node

/**
 * Debug script to understand CrossSection polygon format requirements
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function debugCrossSection() {
  console.log('🔍 Debugging CrossSection polygon format...');
  
  try {
    // Load the generated pipeline
    const pipelinePath = join(__dirname, 'temp', 'pipeline.js');
    const { default: pipeline } = await import(pipelinePath);
    
    // Check what's available on the pipeline
    console.log('Pipeline methods:', Object.keys(pipeline));

    // Try to import CrossSection directly
    const { CrossSection } = await import('@manifold-studio/wrapper');

    console.log('✅ CrossSection loaded from wrapper');
    
    // Test 1: Simple square polygon
    console.log('\n📐 Test 1: Simple square polygon');
    try {
      const square = [
        [0, 0],
        [10, 0], 
        [10, 10],
        [0, 10]
      ];
      
      console.log('Input polygon:', square);
      const cs1 = new CrossSection([square]);
      console.log('✅ Square CrossSection created successfully');
      console.log('Vertices:', cs1.numVert ? cs1.numVert() : 'unknown');
    } catch (error) {
      console.log('❌ Square test failed:', error.message);
    }
    
    // Test 2: Empty polygon array
    console.log('\n📐 Test 2: Empty polygon array');
    try {
      const cs2 = new CrossSection([]);
      console.log('✅ Empty CrossSection created successfully');
    } catch (error) {
      console.log('❌ Empty test failed:', error.message);
    }
    
    // Test 3: Multiple polygons
    console.log('\n📐 Test 3: Multiple polygons');
    try {
      const polygons = [
        [[0, 0], [5, 0], [5, 5], [0, 5]], // outer square
        [[1, 1], [4, 1], [4, 4], [1, 4]]  // inner square (hole)
      ];
      
      console.log('Input polygons:', polygons);
      const cs3 = new CrossSection(polygons);
      console.log('✅ Multiple polygons CrossSection created successfully');
    } catch (error) {
      console.log('❌ Multiple polygons test failed:', error.message);
    }
    
    // Test 4: Invalid polygon data
    console.log('\n📐 Test 4: Invalid polygon data');
    try {
      const invalid = [
        [{x: 0, y: 0}, {x: 10, y: 0}, {x: 10, y: 10}, {x: 0, y: 10}] // Vec2 format
      ];
      
      console.log('Input invalid polygon:', invalid);
      const cs4 = new CrossSection(invalid);
      console.log('✅ Invalid polygon test unexpectedly succeeded');
    } catch (error) {
      console.log('❌ Invalid polygon test failed as expected:', error.message);
    }
    
    console.log('\n🎉 CrossSection format debugging completed!');
    
  } catch (error) {
    console.error('💥 Debug script failed:', error);
  }
}

// Run the debug
debugCrossSection()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
