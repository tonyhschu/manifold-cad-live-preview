import { describe, test, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Use require for OpenType.js to avoid ES module issues in test environment
const opentype = require('opentype.js');

describe('Font Loading - Step 1: Basic OpenType.js + File System', () => {
  const fontPath = path.join(__dirname, '..', 'assets', 'fonts', 'Roboto-Regular.ttf');

  test('TTF file exists and is readable', () => {
    console.log('Testing font file at:', fontPath);
    
    // Check file exists
    expect(fs.existsSync(fontPath)).toBe(true);
    
    // Check file stats
    const stats = fs.statSync(fontPath);
    console.log('File size:', stats.size, 'bytes');
    expect(stats.size).toBeGreaterThan(0);
    expect(stats.isFile()).toBe(true);
    
    // Check file is readable
    expect(() => fs.accessSync(fontPath, fs.constants.R_OK)).not.toThrow();
    
    console.log('✅ Font file exists and is readable');
  });

  test('OpenType.js can parse TTF file directly', () => {
    console.log('Testing OpenType.js parsing...');
    
    // Load font synchronously (Node.js only)
    let font: opentype.Font;
    expect(() => {
      font = opentype.loadSync(fontPath);
    }).not.toThrow();
    
    // Verify we got a valid font object
    expect(font).toBeDefined();
    expect(font.names).toBeDefined();
    expect(font.glyphs).toBeDefined();
    
    // Check basic font properties
    console.log('Font family name:', font.names.fontFamily?.en);
    console.log('Font subfamily:', font.names.fontSubfamily?.en);
    console.log('Number of glyphs:', font.glyphs.length);
    
    expect(font.names.fontFamily?.en).toBeTruthy();
    expect(font.glyphs.length).toBeGreaterThan(0);
    
    console.log('✅ OpenType.js successfully parsed the font');
  });

  test('Font contains expected basic glyphs', () => {
    console.log('Testing glyph availability...');
    
    const font = opentype.loadSync(fontPath);
    
    // Test basic ASCII characters
    const testChars = ['H', 'E', 'L', 'O', 'A', 'B', 'C'];
    
    for (const char of testChars) {
      const glyph = font.charToGlyph(char);
      expect(glyph).toBeDefined();
      expect(glyph.unicode).toBe(char.charCodeAt(0));
      
      console.log(`Glyph for '${char}':`, {
        name: glyph.name,
        unicode: glyph.unicode,
        advanceWidth: glyph.advanceWidth,
        hasPath: !!glyph.path
      });
    }
    
    console.log('✅ Font contains expected basic glyphs');
  });

  test('Can extract glyph paths', () => {
    console.log('Testing glyph path extraction...');
    
    const font = opentype.loadSync(fontPath);
    const testChar = 'H';
    const glyph = font.charToGlyph(testChar);
    
    expect(glyph.path).toBeDefined();
    
    // Get the path commands
    const path = glyph.path;
    console.log(`Path for '${testChar}':`, {
      commands: path.commands.length,
      firstCommand: path.commands[0]?.type,
      boundingBox: path.getBoundingBox()
    });
    
    expect(path.commands.length).toBeGreaterThan(0);
    
    // Check that we can get bounding box
    const bbox = path.getBoundingBox();
    expect(bbox.x1).toBeDefined();
    expect(bbox.y1).toBeDefined();
    expect(bbox.x2).toBeDefined();
    expect(bbox.y2).toBeDefined();
    
    console.log('✅ Successfully extracted glyph paths');
  });

  test('Font loading performance', () => {
    console.log('Testing font loading performance...');
    
    const startTime = Date.now();
    const font = opentype.loadSync(fontPath);
    const loadTime = Date.now() - startTime;
    
    console.log(`Font loaded in ${loadTime}ms`);
    expect(loadTime).toBeLessThan(1000); // Should load in under 1 second
    
    // Test glyph access performance
    const glyphStartTime = Date.now();
    const glyph = font.charToGlyph('A');
    const glyphTime = Date.now() - glyphStartTime;
    
    console.log(`Glyph accessed in ${glyphTime}ms`);
    expect(glyphTime).toBeLessThan(10); // Should be very fast
    
    console.log('✅ Font loading performance is acceptable');
  });
});

describe('Font Loading - Step 2: FontResolver Logic Simulation', () => {
  const fontPath = path.join(__dirname, '..', 'assets', 'fonts', 'Roboto-Regular.ttf');

  test('Environment detection works correctly', () => {
    console.log('Testing environment detection...');

    // In Node.js, window should be undefined
    expect(typeof window).toBe('undefined');

    // This is how FontResolver detects browser vs Node.js
    const isBrowser = typeof window !== 'undefined';
    expect(isBrowser).toBe(false);

    console.log('✅ Running in Node.js environment as expected');
  });

  test('Node.js font loading path works (simulating FontResolver)', async () => {
    console.log('Testing Node.js font loading logic...');

    // This simulates what FontResolver.loadFontInNode() does
    const loadFontInNode = (filePath: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Font loading timeout'));
        }, 10000);

        try {
          // This is what FontResolver does in Node.js - use opentype.load
          opentype.load(filePath, (err: any, font: any) => {
            clearTimeout(timeout);
            if (err) {
              reject(new Error(`OpenType.js error: ${err.message}`));
            } else {
              resolve({
                font: font,
                info: {
                  name: 'Roboto Regular',
                  family: 'Roboto',
                  weight: '400',
                  url: filePath
                }
              });
            }
          });
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      });
    };

    const startTime = Date.now();
    const loadedFont = await loadFontInNode(fontPath);
    const loadTime = Date.now() - startTime;

    console.log(`Font loaded in ${loadTime}ms`);

    // Verify we got a valid loaded font object
    expect(loadedFont).toBeDefined();
    expect(loadedFont.font).toBeDefined();
    expect(loadedFont.info).toBeDefined();

    // Verify the font object has expected properties
    expect(loadedFont.font.names).toBeDefined();
    expect(loadedFont.font.glyphs).toBeDefined();
    expect(loadedFont.font.names.fontFamily?.en).toBe('Roboto');

    console.log('Font info:', {
      name: loadedFont.info.name,
      family: loadedFont.info.family,
      weight: loadedFont.info.weight,
      url: loadedFont.info.url
    });

    console.log('✅ Node.js font loading logic works correctly');
  });

  test('File path resolution works correctly', () => {
    console.log('Testing file path resolution...');

    // Test the path resolution logic that FontResolver uses
    const relativePath = '/assets/fonts/Roboto-Regular.ttf';
    const resolvedPath = path.join(__dirname, '..', relativePath.substring(1)); // Remove leading slash

    console.log('Relative path:', relativePath);
    console.log('Resolved path:', resolvedPath);
    console.log('Expected path:', fontPath);

    expect(resolvedPath).toBe(fontPath);
    expect(fs.existsSync(resolvedPath)).toBe(true);

    console.log('✅ File path resolution works correctly');
  });

  test('Font loading with different path formats', async () => {
    console.log('Testing different path formats...');

    // Test absolute path (what works)
    const absolutePath = fontPath;
    const font1 = opentype.loadSync(absolutePath);
    expect(font1).toBeDefined();
    console.log('✅ Absolute path works');

    // Test relative path from current directory
    const relativePath = path.relative(process.cwd(), fontPath);
    const font2 = opentype.loadSync(relativePath);
    expect(font2).toBeDefined();
    console.log('✅ Relative path works');

    // Test what happens with URL-style path (this might be the issue)
    const urlStylePath = '/assets/fonts/Roboto-Regular.ttf';
    try {
      const font3 = opentype.loadSync(urlStylePath);
      console.log('✅ URL-style path works (unexpected!)');
    } catch (error) {
      console.log('❌ URL-style path fails (expected):', error.message);
      // This is expected - URL paths don't work in Node.js file system
    }

    console.log('✅ Path format testing complete');
  });

  test('Simulated font caching logic', async () => {
    console.log('Testing font caching simulation...');

    // Simulate the caching logic that FontResolver uses
    const fontCache = new Map();

    const loadWithCache = async (fontName: string): Promise<any> => {
      if (fontCache.has(fontName)) {
        return fontCache.get(fontName);
      }

      const font = opentype.loadSync(fontPath);
      const loadedFont = {
        font: font,
        info: { name: fontName, family: 'Roboto', weight: '400', url: fontPath }
      };

      fontCache.set(fontName, loadedFont);
      return loadedFont;
    };

    // Load font first time
    const startTime1 = Date.now();
    const loadedFont1 = await loadWithCache('Roboto Regular');
    const loadTime1 = Date.now() - startTime1;

    // Load same font second time (should be cached)
    const startTime2 = Date.now();
    const loadedFont2 = await loadWithCache('Roboto Regular');
    const loadTime2 = Date.now() - startTime2;

    console.log(`First load: ${loadTime1}ms, Second load: ${loadTime2}ms`);

    // Second load should be much faster (cached)
    expect(loadTime2).toBeLessThan(loadTime1);
    expect(loadTime2).toBeLessThan(2); // Should be nearly instant

    // Should return the same object reference
    expect(loadedFont1).toBe(loadedFont2);

    console.log('✅ Font caching simulation works correctly');
  });
});

describe('Font Loading - Step 2.5: FontResolver Path Resolution Fix', () => {
  test('Path resolution logic works correctly', () => {
    console.log('Testing path resolution logic...');

    // Simulate the resolveUrlToFilePath logic (matching FontResolver implementation)
    const resolveUrlToFilePath = (url: string): string => {
      // If it's an HTTP/HTTPS URL, return as-is (opentype.js can handle these)
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }

      // If it's already an absolute file system path, return as-is
      if (path.isAbsolute(url) && !url.startsWith('/assets/')) {
        return url;
      }

      // If it's a web-style URL starting with /assets/, resolve relative to project root
      if (url.startsWith('/')) {
        // Remove leading slash and resolve relative to current working directory
        const relativePath = url.substring(1);
        return path.resolve(process.cwd(), relativePath);
      }

      // Otherwise, treat as relative path
      return path.resolve(process.cwd(), url);
    };

    // Test different URL formats
    const testCases = [
      {
        input: '/assets/fonts/Roboto-Regular.ttf',
        expected: path.resolve(process.cwd(), 'assets/fonts/Roboto-Regular.ttf'),
        description: 'Web-style URL'
      },
      {
        input: 'assets/fonts/Roboto-Regular.ttf',
        expected: path.resolve(process.cwd(), 'assets/fonts/Roboto-Regular.ttf'),
        description: 'Relative path'
      },
      {
        input: path.resolve(process.cwd(), 'assets/fonts/Roboto-Regular.ttf'),
        expected: path.resolve(process.cwd(), 'assets/fonts/Roboto-Regular.ttf'),
        description: 'Absolute path'
      },
      {
        input: 'https://example.com/font.ttf',
        expected: 'https://example.com/font.ttf',
        description: 'HTTP URL'
      }
    ];

    for (const testCase of testCases) {
      const result = resolveUrlToFilePath(testCase.input);
      console.log(`${testCase.description}: '${testCase.input}' -> '${result}'`);
      expect(result).toBe(testCase.expected);
    }

    console.log('✅ Path resolution logic works correctly');
  });

  test('Resolved path points to actual font file', () => {
    console.log('Testing resolved path points to actual file...');

    const webStyleUrl = '/assets/fonts/Roboto-Regular.ttf';
    const resolvedPath = path.resolve(process.cwd(), webStyleUrl.substring(1));

    console.log('Web-style URL:', webStyleUrl);
    console.log('Resolved path:', resolvedPath);
    console.log('File exists:', fs.existsSync(resolvedPath));

    expect(fs.existsSync(resolvedPath)).toBe(true);

    // Verify it's the same file we've been testing
    const stats = fs.statSync(resolvedPath);
    expect(stats.size).toBe(515100); // Roboto Regular size

    console.log('✅ Resolved path points to actual font file');
  });
});


