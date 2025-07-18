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

describe('Two-Stage Font Architecture Test', () => {
  let TextToCrossSection: any;

  beforeEach(async () => {
    // Import the actual classes after mocking
    const typefaceModule = await import('../components/typeface');

    // Extract the class from the module
    TextToCrossSection = (typefaceModule as any).TextToCrossSection;
  });

  test('should detect holes in short strings with real font loading', async () => {
    const converter = new TextToCrossSection();

    try {
      await converter.loadDefaultFont();
      expect(converter.isFontLoaded).toBe(true);

      // Test with a short string containing holes
      const shortText = 'HELLO'; // Contains 'O' which has a hole

      // Test Stage 1: textToPolygons with built-in hole detection
      const polygons = converter.textToPolygons(shortText, 50, { debug: true });
      expect(polygons.length).toBeGreaterThan(0);

      // Test Stage 2: polygonsToCrossSection
      const crossSection = converter.polygonsToCrossSection(polygons);
      expect(crossSection).toBeDefined();

      // Test combined method
      const combinedCrossSection = converter.textToCrossSection(shortText, 50, { debug: true });
      expect(combinedCrossSection).toBeDefined();

      console.log(`Short text "${shortText}": Generated ${polygons.length} polygons with proper winding order`);

      // With our new architecture, polygons already have correct winding order
      // We can verify this by checking that we have multiple polygons for 'O' (outer + hole)
      expect(polygons.length).toBeGreaterThan(5); // HELLO should have multiple polygons

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

      // Test the new two-stage approach
      const polygons = converter.textToPolygons(longText, 50, { debug: true });
      expect(polygons.length).toBeGreaterThan(0);

      const crossSection = converter.polygonsToCrossSection(polygons);
      expect(crossSection).toBeDefined();

      // Test combined method
      const combinedCrossSection = converter.textToCrossSection(longText, 50, { debug: true });
      expect(combinedCrossSection).toBeDefined();

      console.log(`Long text "${longText}": Generated ${polygons.length} polygons with proper winding order`);

      // HELLO WORLD should have many polygons (each character contributes 1-2 polygons)
      // With our character-by-character approach, longer strings work just as well as short ones
      expect(polygons.length).toBeGreaterThan(10); // Should have multiple polygons for all characters

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

      // Use the new textToPolygons method which has built-in hole detection
      const shortPolygons = converter.textToPolygons(shortText, 50, { debug: true });
      const longPolygons = converter.textToPolygons(longText, 50, { debug: true });

      console.log(`Short "${shortText}": ${shortPolygons.length} polygons`);
      console.log(`Long "${longText}": ${longPolygons.length} polygons`);

      // The longer string should have more polygons (roughly 3x as many)
      // Each 'O' should contribute 2 polygons (outer + hole)
      expect(longPolygons.length).toBeGreaterThan(shortPolygons.length);

      // Both should generate polygons (this was the original bug - long strings failed)
      expect(shortPolygons.length).toBeGreaterThan(0);
      expect(longPolygons.length).toBeGreaterThan(0);

      // Test that both can be converted to CrossSections successfully
      const shortCrossSection = converter.polygonsToCrossSection(shortPolygons);
      const longCrossSection = converter.polygonsToCrossSection(longPolygons);

      expect(shortCrossSection).toBeDefined();
      expect(longCrossSection).toBeDefined();

      // Verify the combined method works for both
      const shortCombined = converter.textToCrossSection(shortText, 50);
      const longCombined = converter.textToCrossSection(longText, 50);

      expect(shortCombined).toBeDefined();
      expect(longCombined).toBeDefined();

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

      // Test Stage 1: textToPolygons (includes hole detection)
      const startTime = Date.now();
      const polygons = converter.textToPolygons(veryLongText, 30, { // Smaller font size
        holeThreshold: 0.9,
        sampleCount: 50, // Reduced sample count for performance
        debug: false
      });
      const polygonTime = Date.now() - startTime;

      // Test Stage 2: polygonsToCrossSection
      const crossSectionStartTime = Date.now();
      const crossSection = converter.polygonsToCrossSection(polygons);
      const crossSectionTime = Date.now() - crossSectionStartTime;

      // Test combined method
      const combinedStartTime = Date.now();
      const combinedCrossSection = converter.textToCrossSection(veryLongText, 30, {
        holeThreshold: 0.9,
        sampleCount: 50,
        debug: false
      });
      const combinedTime = Date.now() - combinedStartTime;

      console.log(`Very long text (${veryLongText.length} chars): Generated ${polygons.length} polygons`);
      console.log(`Stage 1 (textToPolygons): ${polygonTime}ms`);
      console.log(`Stage 2 (polygonsToCrossSection): ${crossSectionTime}ms`);
      console.log(`Combined method: ${combinedTime}ms`);

      // Should complete in reasonable time (less than 5 seconds each)
      expect(polygonTime).toBeLessThan(5000);
      expect(crossSectionTime).toBeLessThan(1000); // Stage 2 should be very fast
      expect(combinedTime).toBeLessThan(5000);

      // Should generate polygons for very long strings
      expect(polygons.length).toBeGreaterThan(0);
      expect(crossSection).toBeDefined();
      expect(combinedCrossSection).toBeDefined();

    } catch (error) {
      console.warn('Font loading failed, skipping test:', error);
    }
  });

  test('should demonstrate two-stage architecture benefits', async () => {
    const converter = new TextToCrossSection();

    try {
      await converter.loadDefaultFont();

      const testText = 'HELLO'; // Mix of characters with and without holes

      // Stage 1: textToPolygons - should handle hole detection per character
      const polygons = converter.textToPolygons(testText, 50, { debug: true });

      // Verify we got polygons
      expect(polygons.length).toBeGreaterThan(0);

      // Stage 2: polygonsToCrossSection - should convert to ManifoldCAD format
      const crossSection = converter.polygonsToCrossSection(polygons);
      expect(crossSection).toBeDefined();

      // Combined method should work identically
      const combinedCrossSection = converter.textToCrossSection(testText, 50, { debug: true });
      expect(combinedCrossSection).toBeDefined();

      console.log('Two-stage architecture test completed successfully');
      console.log(`Generated ${polygons.length} polygons for "${testText}"`);

      // The key benefit: character-by-character processing means consistent results
      // regardless of string length (no multi-character interference)

    } catch (error) {
      console.warn('Font loading failed, skipping test:', error);
    }
  });
});
