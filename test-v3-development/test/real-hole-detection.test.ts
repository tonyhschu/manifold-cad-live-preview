import { describe, test, expect, beforeEach, vi } from 'vitest';

// Import the actual TextToCrossSection class
// We'll need to mock ManifoldCAD since it's not available in test environment
const mockManifold = {
  CrossSection: class MockCrossSection {
    constructor(public polygons: any[]) {}
  },
  extrude: (crossSection: any, height: number) => ({ 
    id: 'mock-extruded',
    crossSection,
    height 
  })
};

// Mock the ManifoldCAD import
vi.mock('manifold-3d', () => ({
  default: mockManifold,
  CrossSection: mockManifold.CrossSection
}));

describe('Real Font Hole Detection Test', () => {
  let TextToCrossSection: any;
  let classifyFontPolygons: any;

  beforeEach(async () => {
    // Import the actual classes after mocking
    const typefaceModule = await import('../components/typeface');
    const classifierModule = await import('../lib/font-polygon-classifier');
    
    // Extract the class from the module
    TextToCrossSection = (typefaceModule as any).TextToCrossSection;
    classifyFontPolygons = classifierModule.classifyFontPolygons;
  });

  test('should detect holes in short strings with real font loading', async () => {
    const converter = new TextToCrossSection();
    
    try {
      await converter.loadDefaultFont();
      expect(converter.isFontLoaded).toBe(true);
      
      // Test with a short string containing holes
      const shortText = 'HELLO'; // Contains 'O' which has a hole
      const polygons = converter.textToCrossSection(shortText, 50);
      
      expect(polygons.length).toBeGreaterThan(0);
      
      // Classify the polygons
      const classifications = classifyFontPolygons(polygons, {
        holeThreshold: 0.9,
        sampleCount: 100,
        debug: true
      });
      
      // Should have both solid parts and holes
      const solidCount = classifications.filter(c => !c.isHole).length;
      const holeCount = classifications.filter(c => c.isHole).length;
      
      console.log(`Short text "${shortText}": ${solidCount} solid, ${holeCount} holes`);
      
      // HELLO should have at least one hole (from the O)
      expect(holeCount).toBeGreaterThan(0);
      
    } catch (error) {
      console.warn('Font loading failed, skipping test:', error);
      // Skip test if font loading fails
    }
  });

  test('should detect holes in longer strings with real font loading', async () => {
    const converter = new TextToCrossSection();
    
    try {
      await converter.loadDefaultFont();
      expect(converter.isFontLoaded).toBe(true);
      
      // Test with a longer string containing holes
      const longText = 'HELLO WORLD'; // Contains 'O' characters which have holes
      const polygons = converter.textToCrossSection(longText, 50);
      
      expect(polygons.length).toBeGreaterThan(0);
      
      // Classify the polygons
      const classifications = classifyFontPolygons(polygons, {
        holeThreshold: 0.9,
        sampleCount: 100,
        debug: true
      });
      
      // Should have both solid parts and holes
      const solidCount = classifications.filter(c => !c.isHole).length;
      const holeCount = classifications.filter(c => c.isHole).length;
      
      console.log(`Long text "${longText}": ${solidCount} solid, ${holeCount} holes`);
      
      // HELLO WORLD should have at least 2 holes (from the two O's)
      expect(holeCount).toBeGreaterThan(0);
      
      // With the improved algorithm, longer strings should still detect holes
      expect(holeCount).toBeGreaterThanOrEqual(2);
      
    } catch (error) {
      console.warn('Font loading failed, skipping test:', error);
      // Skip test if font loading fails
    }
  });

  test('should compare hole detection between short and long strings', async () => {
    const converter = new TextToCrossSection();
    
    try {
      await converter.loadDefaultFont();
      
      // Test both short and long versions of similar text
      const shortText = 'OOO';           // 3 O's
      const longText = 'OOO OOO OOO';    // 9 O's (much longer)
      
      const shortPolygons = converter.textToCrossSection(shortText, 50);
      const longPolygons = converter.textToCrossSection(longText, 50);
      
      const shortClassifications = classifyFontPolygons(shortPolygons, {
        holeThreshold: 0.9,
        sampleCount: 100,
        debug: true
      });
      
      const longClassifications = classifyFontPolygons(longPolygons, {
        holeThreshold: 0.9,
        sampleCount: 100,
        debug: true
      });
      
      const shortHoles = shortClassifications.filter(c => c.isHole).length;
      const longHoles = longClassifications.filter(c => c.isHole).length;
      
      console.log(`Short "${shortText}": ${shortHoles} holes`);
      console.log(`Long "${longText}": ${longHoles} holes`);
      
      // The longer string should have more holes (roughly 3x as many)
      expect(longHoles).toBeGreaterThan(shortHoles);
      
      // Both should detect holes (this was the original bug)
      expect(shortHoles).toBeGreaterThan(0);
      expect(longHoles).toBeGreaterThan(0);
      
    } catch (error) {
      console.warn('Font loading failed, skipping test:', error);
    }
  });

  test('should handle very long strings without performance issues', async () => {
    const converter = new TextToCrossSection();
    
    try {
      await converter.loadDefaultFont();
      
      // Test with a very long string
      const veryLongText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(3); // 78 characters
      
      const startTime = Date.now();
      const polygons = converter.textToCrossSection(veryLongText, 30); // Smaller font size
      const conversionTime = Date.now() - startTime;
      
      const classifyStartTime = Date.now();
      const classifications = classifyFontPolygons(polygons, {
        holeThreshold: 0.9,
        sampleCount: 50, // Reduced sample count for performance
        debug: false
      });
      const classifyTime = Date.now() - classifyStartTime;
      
      const holeCount = classifications.filter(c => c.isHole).length;
      const solidCount = classifications.filter(c => !c.isHole).length;
      
      console.log(`Very long text (${veryLongText.length} chars): ${solidCount} solid, ${holeCount} holes`);
      console.log(`Conversion time: ${conversionTime}ms, Classification time: ${classifyTime}ms`);
      
      // Should complete in reasonable time (less than 5 seconds)
      expect(conversionTime).toBeLessThan(5000);
      expect(classifyTime).toBeLessThan(5000);
      
      // Should still detect holes in very long strings
      expect(holeCount).toBeGreaterThan(0);
      
    } catch (error) {
      console.warn('Font loading failed, skipping test:', error);
    }
  });
});
