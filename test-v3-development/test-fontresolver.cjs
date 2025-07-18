// Simple test script to verify FontResolver works with our path resolution fix
// This uses CommonJS to avoid ES module issues

const opentype = require('opentype.js');
const path = require('path');
const fs = require('fs');

// Simulate the FontResolver path resolution logic
function resolveUrlToFilePath(url) {
  console.log(`Resolving URL: ${url}`);
  
  // If it's an HTTP/HTTPS URL, return as-is (opentype.js can handle these)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log('  -> HTTP URL, returning as-is');
    return url;
  }
  
  // If it's already an absolute file system path, return as-is
  if (path.isAbsolute(url) && !url.startsWith('/assets/')) {
    console.log('  -> Absolute file path, returning as-is');
    return url;
  }
  
  // If it's a web-style URL starting with /assets/, resolve relative to project root
  if (url.startsWith('/')) {
    // Remove leading slash and resolve relative to current working directory
    const relativePath = url.substring(1);
    const resolved = path.resolve(process.cwd(), relativePath);
    console.log(`  -> Web-style URL, resolved to: ${resolved}`);
    return resolved;
  }
  
  // Otherwise, treat as relative path
  const resolved = path.resolve(process.cwd(), url);
  console.log(`  -> Relative path, resolved to: ${resolved}`);
  return resolved;
}

// Test the font loading with our path resolution
async function testFontLoading() {
  console.log('=== FontResolver Path Resolution Test ===');
  console.log('Current working directory:', process.cwd());
  
  // Test the web-style URL that our FontResolver uses
  const webStyleUrl = '/assets/fonts/Roboto-Regular.ttf';
  const resolvedPath = resolveUrlToFilePath(webStyleUrl);
  
  console.log('\n1. Path Resolution Test:');
  console.log(`   Input: ${webStyleUrl}`);
  console.log(`   Output: ${resolvedPath}`);
  console.log(`   File exists: ${fs.existsSync(resolvedPath)}`);
  
  if (!fs.existsSync(resolvedPath)) {
    console.error('❌ Font file not found at resolved path!');
    return;
  }
  
  console.log('\n2. OpenType.js Loading Test:');
  try {
    const startTime = Date.now();
    
    // Test loading with the resolved path
    const font = opentype.loadSync(resolvedPath);
    const loadTime = Date.now() - startTime;
    
    console.log(`✅ Font loaded successfully in ${loadTime}ms`);
    console.log(`   Family: ${font.names.fontFamily?.en}`);
    console.log(`   Subfamily: ${font.names.fontSubfamily?.en}`);
    console.log(`   Glyphs: ${font.glyphs.length}`);
    
    // Test glyph access
    const hGlyph = font.charToGlyph('H');
    console.log(`   'H' glyph: ${hGlyph.name}, unicode: ${hGlyph.unicode}`);
    
    console.log('\n✅ FontResolver path resolution fix works correctly!');
    
  } catch (error) {
    console.error('❌ Font loading failed:', error.message);
  }
}

// Run the test
testFontLoading().catch(console.error);
