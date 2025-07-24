import { describe, test, expect } from 'vitest';
import { classifyFontPolygons } from '../lib/font-polygon-classifier';

// Helper to create realistic font-like polygons
function createLetterO(x: number, y: number, size: number) {
  const outer = [];
  const inner = [];
  const segments = 16;
  
  // Outer contour (counter-clockwise)
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    outer.push({
      x: x + Math.cos(angle) * size,
      y: y + Math.sin(angle) * size
    });
  }
  
  // Inner hole (clockwise)
  for (let i = segments - 1; i >= 0; i--) {
    const angle = (i / segments) * 2 * Math.PI;
    inner.push({
      x: x + Math.cos(angle) * size * 0.6,
      y: y + Math.sin(angle) * size * 0.6
    });
  }
  
  return { outer, inner };
}

function createLetterH(x: number, y: number, size: number) {
  const strokeWidth = size * 0.2;
  
  // Left vertical bar
  const leftBar = [
    { x: x, y: y - size },
    { x: x + strokeWidth, y: y - size },
    { x: x + strokeWidth, y: y + size },
    { x: x, y: y + size }
  ];
  
  // Right vertical bar
  const rightBar = [
    { x: x + size - strokeWidth, y: y - size },
    { x: x + size, y: y - size },
    { x: x + size, y: y + size },
    { x: x + size - strokeWidth, y: y + size }
  ];
  
  // Cross bar
  const crossBar = [
    { x: x + strokeWidth, y: y - strokeWidth/2 },
    { x: x + size - strokeWidth, y: y - strokeWidth/2 },
    { x: x + size - strokeWidth, y: y + strokeWidth/2 },
    { x: x + strokeWidth, y: y + strokeWidth/2 }
  ];
  
  return { leftBar, rightBar, crossBar };
}

describe('Integration: Hole Detection with Realistic Font Polygons', () => {
  test('should correctly classify single letter O', () => {
    const letterO = createLetterO(0, 0, 50);
    const polygons = [letterO.outer, letterO.inner];
    
    const classifications = classifyFontPolygons(polygons, {
      holeThreshold: 0.9,
      sampleCount: 100,
      debug: true
    });
    
    expect(classifications).toHaveLength(2);
    
    // One should be solid (outer), one should be hole (inner)
    const solidCount = classifications.filter(c => !c.isHole).length;
    const holeCount = classifications.filter(c => c.isHole).length;
    
    expect(solidCount).toBe(1);
    expect(holeCount).toBe(1);
    
    console.log('Single O classification:');
    classifications.forEach((c, i) => {
      console.log(`  Polygon ${i}: ${c.isHole ? 'HOLE' : 'SOLID'} (area: ${c.area.toFixed(0)}, confidence: ${c.confidence.toFixed(2)})`);
    });
  });

  test('should correctly classify short string: HO', () => {
    const letterH = createLetterH(0, 0, 50);
    const letterO = createLetterO(100, 0, 50);
    
    const polygons = [
      letterH.leftBar,
      letterH.rightBar, 
      letterH.crossBar,
      letterO.outer,
      letterO.inner
    ];
    
    const classifications = classifyFontPolygons(polygons, {
      holeThreshold: 0.9,
      sampleCount: 100,
      debug: true
    });
    
    expect(classifications).toHaveLength(5);
    
    // H has 3 solid parts, O has 1 solid + 1 hole = 4 solid, 1 hole total
    const solidCount = classifications.filter(c => !c.isHole).length;
    const holeCount = classifications.filter(c => c.isHole).length;
    
    expect(solidCount).toBe(4);
    expect(holeCount).toBe(1);
    
    console.log('Short string "HO" classification:');
    classifications.forEach((c, i) => {
      console.log(`  Polygon ${i}: ${c.isHole ? 'HOLE' : 'SOLID'} (area: ${c.area.toFixed(0)}, method: ${c.debugInfo?.method})`);
    });
  });

  test('should correctly classify longer string: HOHOHO', () => {
    const polygons = [];
    
    // Create H-O-H-O-H-O pattern
    for (let i = 0; i < 3; i++) {
      const xOffset = i * 200;
      
      // Add H
      const letterH = createLetterH(xOffset, 0, 50);
      polygons.push(letterH.leftBar, letterH.rightBar, letterH.crossBar);
      
      // Add O
      const letterO = createLetterO(xOffset + 100, 0, 50);
      polygons.push(letterO.outer, letterO.inner);
    }
    
    // Should have 3 H's (9 polygons) + 3 O's (6 polygons) = 15 total
    expect(polygons).toHaveLength(15);
    
    const classifications = classifyFontPolygons(polygons, {
      holeThreshold: 0.9,
      sampleCount: 100,
      debug: true
    });
    
    expect(classifications).toHaveLength(15);
    
    // 3 H's (9 solid) + 3 O's (3 solid + 3 holes) = 12 solid, 3 holes
    const solidCount = classifications.filter(c => !c.isHole).length;
    const holeCount = classifications.filter(c => c.isHole).length;
    
    expect(solidCount).toBe(12);
    expect(holeCount).toBe(3);
    
    console.log('Long string "HOHOHO" classification:');
    console.log(`  Total: ${solidCount} solid, ${holeCount} holes`);
    
    // Verify that all holes are correctly identified
    const holeClassifications = classifications.filter(c => c.isHole);
    holeClassifications.forEach((c, i) => {
      expect(c.confidence).toBeGreaterThan(0.8); // High confidence in hole detection
      console.log(`  Hole ${i}: confidence ${c.confidence.toFixed(2)}, method: ${c.debugInfo?.method}`);
    });
  });

  test('should handle very long string without performance degradation', () => {
    const polygons = [];
    const letterCount = 20; // Simulate 20 letters
    
    const startTime = Date.now();
    
    // Create alternating H-O pattern
    for (let i = 0; i < letterCount; i++) {
      const xOffset = i * 100;
      
      if (i % 2 === 0) {
        // Add H
        const letterH = createLetterH(xOffset, 0, 40);
        polygons.push(letterH.leftBar, letterH.rightBar, letterH.crossBar);
      } else {
        // Add O
        const letterO = createLetterO(xOffset, 0, 40);
        polygons.push(letterO.outer, letterO.inner);
      }
    }
    
    const setupTime = Date.now() - startTime;
    
    const classifyStartTime = Date.now();
    const classifications = classifyFontPolygons(polygons, {
      holeThreshold: 0.9,
      sampleCount: 50, // Reduced for performance
      debug: false
    });
    const classifyTime = Date.now() - classifyStartTime;
    
    const solidCount = classifications.filter(c => !c.isHole).length;
    const holeCount = classifications.filter(c => c.isHole).length;
    
    console.log(`Very long string (${letterCount} letters, ${polygons.length} polygons):`);
    console.log(`  Setup time: ${setupTime}ms, Classification time: ${classifyTime}ms`);
    console.log(`  Result: ${solidCount} solid, ${holeCount} holes`);
    
    // Should complete quickly (less than 1 second for classification)
    expect(classifyTime).toBeLessThan(1000);
    
    // Should still detect holes correctly
    expect(holeCount).toBeGreaterThan(0);
    expect(holeCount).toBe(10); // 10 O's = 10 holes
    expect(solidCount).toBe(40); // 10 H's (30 parts) + 10 O's (10 outer) = 40 solid
  });

  test('should demonstrate the fix for the original bug', () => {
    // This test demonstrates that the new algorithm works where the old one failed
    
    // Simulate the problematic case: multiple separate characters
    const polygons = [];
    
    // Create 5 separate O's (like "OOOOO")
    for (let i = 0; i < 5; i++) {
      const letterO = createLetterO(i * 120, 0, 50);
      polygons.push(letterO.outer, letterO.inner);
    }
    
    const classifications = classifyFontPolygons(polygons, {
      holeThreshold: 0.9,
      sampleCount: 100,
      debug: true
    });
    
    expect(classifications).toHaveLength(10); // 5 outer + 5 inner
    
    const solidCount = classifications.filter(c => !c.isHole).length;
    const holeCount = classifications.filter(c => c.isHole).length;
    
    // Should correctly identify 5 solid (outer) and 5 holes (inner)
    expect(solidCount).toBe(5);
    expect(holeCount).toBe(5);
    
    console.log('Bug fix demonstration - 5 separate O\'s:');
    console.log(`  Correctly identified: ${solidCount} solid, ${holeCount} holes`);
    
    // Verify that each hole has high confidence
    const holeClassifications = classifications.filter(c => c.isHole);
    holeClassifications.forEach(c => {
      expect(c.confidence).toBeGreaterThan(0.8);
    });
    
    // Verify that the method used is the improved one
    const outerContours = classifications.filter(c => !c.isHole);
    outerContours.forEach(c => {
      expect(c.debugInfo?.method).toBe('outer-contour');
    });
    
    const holes = classifications.filter(c => c.isHole);
    holes.forEach(c => {
      expect(c.debugInfo?.method).toBe('contained-hole');
    });
  });
});
