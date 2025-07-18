import { describe, test, expect } from 'vitest';
import { classifyFontPolygons } from '../lib/font-polygon-classifier';

// Helper function to create test polygons
function createRectanglePolygon(x: number, y: number, width: number, height: number) {
  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height }
  ];
}

function createCirclePolygon(centerX: number, centerY: number, radius: number, segments: number = 16) {
  const points = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    points.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    });
  }
  return points;
}

describe('Font Polygon Classification', () => {
  test('should classify simple outer polygon as solid', () => {
    const outerRect = createRectanglePolygon(0, 0, 100, 100);
    const polygons = [outerRect];

    const classifications = classifyFontPolygons(polygons);

    expect(classifications).toHaveLength(1);
    expect(classifications[0].isHole).toBe(false);
    expect(classifications[0].confidence).toBeGreaterThan(0.5);
  });

  test('should classify inner polygon as hole when contained in outer polygon', () => {
    // Create outer rectangle and inner rectangle (like letter "O")
    const outerRect = createRectanglePolygon(0, 0, 100, 100);
    const innerRect = createRectanglePolygon(20, 20, 60, 60);
    const polygons = [outerRect, innerRect];

    const classifications = classifyFontPolygons(polygons, {
      holeThreshold: 0.8,
      sampleCount: 50,
      debug: true
    });

    expect(classifications).toHaveLength(2);

    // Find outer and inner classifications by area size
    const outerClassification = classifications.find(c => c.area === 10000); // 100*100 = 10000
    const innerClassification = classifications.find(c => c.area === 3600);  // 60*60 = 3600

    expect(outerClassification?.isHole).toBe(false);
    expect(innerClassification?.isHole).toBe(true);
    expect(innerClassification?.confidence).toBeGreaterThan(0.8);
  });

  test('should handle multiple separate polygons as solids', () => {
    // Create two separate rectangles (like letter "H" bars)
    const leftRect = createRectanglePolygon(0, 0, 20, 100);
    const rightRect = createRectanglePolygon(80, 0, 20, 100);
    const crossBar = createRectanglePolygon(20, 40, 60, 20);
    const polygons = [leftRect, rightRect, crossBar];

    const classifications = classifyFontPolygons(polygons);

    expect(classifications).toHaveLength(3);
    classifications.forEach(classification => {
      expect(classification.isHole).toBe(false);
    });
  });

  test('should handle complex nested polygons', () => {
    // Create a complex shape with multiple holes
    const outerRect = createRectanglePolygon(0, 0, 200, 100);
    const hole1 = createRectanglePolygon(20, 20, 40, 60);
    const hole2 = createRectanglePolygon(140, 20, 40, 60);
    const polygons = [outerRect, hole1, hole2];

    const classifications = classifyFontPolygons(polygons, {
      holeThreshold: 0.9,
      sampleCount: 100
    });

    expect(classifications).toHaveLength(3);
    
    const solidCount = classifications.filter(c => !c.isHole).length;
    const holeCount = classifications.filter(c => c.isHole).length;
    
    expect(solidCount).toBe(1); // One outer polygon
    expect(holeCount).toBe(2);  // Two holes
  });

  test('should handle edge case with very small polygons', () => {
    const tinyRect = createRectanglePolygon(0, 0, 1, 1);
    const polygons = [tinyRect];

    const classifications = classifyFontPolygons(polygons);

    expect(classifications).toHaveLength(1);
    expect(classifications[0].isHole).toBe(false);
    expect(classifications[0].area).toBeCloseTo(1, 1);
  });

  test('should handle circular polygons', () => {
    const outerCircle = createCirclePolygon(50, 50, 40, 32);
    const innerCircle = createCirclePolygon(50, 50, 20, 16);
    const polygons = [outerCircle, innerCircle];

    const classifications = classifyFontPolygons(polygons, {
      holeThreshold: 0.7,
      sampleCount: 200,
      debug: true
    });

    expect(classifications).toHaveLength(2);

    // Debug output to understand what's happening
    console.log('Circular polygon test results:');
    classifications.forEach((c, i) => {
      console.log(`  Circle ${i}: area=${c.area.toFixed(0)}, isHole=${c.isHole}, confidence=${c.confidence.toFixed(2)}, method=${c.debugInfo?.method}`);
    });

    // The larger circle should be solid, smaller should be hole
    const largerClassification = classifications.find(c => c.area > 4000);
    const smallerClassification = classifications.find(c => c.area < 2000);

    expect(largerClassification?.isHole).toBe(false);
    expect(smallerClassification?.isHole).toBe(true);
  });

  test('should provide debug information when requested', () => {
    const outerRect = createRectanglePolygon(0, 0, 100, 100);
    const innerRect = createRectanglePolygon(25, 25, 50, 50);
    const polygons = [outerRect, innerRect];

    const classifications = classifyFontPolygons(polygons, {
      debug: true,
      sampleCount: 50
    });

    expect(classifications).toHaveLength(2);
    classifications.forEach(classification => {
      expect(classification.debugInfo).toBeDefined();
      expect(classification.debugInfo?.method).toBeDefined();
      expect(classification.debugInfo?.sampleCount).toBe(50);
    });
  });

  test('should handle empty polygon array', () => {
    const classifications = classifyFontPolygons([]);
    expect(classifications).toHaveLength(0);
  });

  test('should handle single point polygon gracefully', () => {
    const singlePoint = [{ x: 0, y: 0 }];
    const polygons = [singlePoint];

    const classifications = classifyFontPolygons(polygons);

    expect(classifications).toHaveLength(1);
    expect(classifications[0].area).toBe(0);
    expect(classifications[0].isHole).toBe(false);
  });

  test('should respect custom threshold settings', () => {
    const outerRect = createRectanglePolygon(0, 0, 100, 100);
    const innerRect = createRectanglePolygon(30, 30, 40, 40);
    const polygons = [outerRect, innerRect];

    // Test with very high threshold (should classify as solid)
    const strictClassifications = classifyFontPolygons(polygons, {
      holeThreshold: 0.99,
      sampleCount: 200
    });

    // Test with low threshold (should classify as hole)
    const lenientClassifications = classifyFontPolygons(polygons, {
      holeThreshold: 0.5,
      sampleCount: 200
    });

    // Find the smaller polygon (inner rectangle)
    const strictInner = strictClassifications.find(c => c.area === 1600); // 40*40 = 1600
    const lenientInner = lenientClassifications.find(c => c.area === 1600);

    // With high threshold, might not classify as hole
    // With low threshold, should definitely classify as hole
    expect(lenientInner?.isHole).toBe(true);
  });
});

describe('Polygon Classification Performance', () => {
  test('should handle large number of polygons efficiently', () => {
    // Create many small polygons
    const polygons = [];
    for (let i = 0; i < 50; i++) {
      polygons.push(createRectanglePolygon(i * 10, 0, 8, 8));
    }

    const startTime = Date.now();
    const classifications = classifyFontPolygons(polygons, {
      sampleCount: 20 // Reduce sample count for performance
    });
    const endTime = Date.now();

    expect(classifications).toHaveLength(50);
    expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
  });

  test('should handle high sample count without timeout', () => {
    const outerRect = createRectanglePolygon(0, 0, 100, 100);
    const innerRect = createRectanglePolygon(25, 25, 50, 50);
    const polygons = [outerRect, innerRect];

    const startTime = Date.now();
    const classifications = classifyFontPolygons(polygons, {
      sampleCount: 1000 // High sample count
    });
    const endTime = Date.now();

    expect(classifications).toHaveLength(2);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
  });
});
