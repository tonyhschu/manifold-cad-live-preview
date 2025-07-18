/**
 * Standalone test for font loading functionality
 * Run this with: node test-font-loading.js
 */

import { fontResolver } from './lib/font-resolver.js';

async function testFontLoading() {
  console.log('🧪 Starting Font Loading Test');
  console.log('Available fonts:', fontResolver.getAvailableFonts());
  
  try {
    // Test loading Inter Regular
    console.log('\n📥 Testing Inter Regular font loading...');
    const startTime = Date.now();
    const loadedFont = await fontResolver.loadFont('Inter Regular');
    const loadTime = Date.now() - startTime;
    
    console.log(`✅ Font loaded successfully in ${loadTime}ms`);
    console.log('Font info:', {
      name: loadedFont.info.name,
      family: loadedFont.info.family,
      weight: loadedFont.info.weight
    });
    
    // Test font metrics
    const font = loadedFont.font;
    console.log('Font metrics:', {
      unitsPerEm: font.unitsPerEm,
      ascender: font.ascender,
      descender: font.descender,
      numGlyphs: font.numGlyphs
    });
    
    // Test getting a simple glyph
    const hGlyph = font.charToGlyph('H');
    console.log('H glyph info:', {
      name: hGlyph.name,
      unicode: hGlyph.unicode,
      advanceWidth: hGlyph.advanceWidth
    });
    
    // Test cache
    console.log('\n🗄️  Testing cache...');
    const cachedFont = await fontResolver.loadFont('Inter Regular');
    console.log('Cache status:', fontResolver.getCacheStatus());
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Font loading test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testFontLoading().catch(console.error);
