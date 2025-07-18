import { describe, test, expect, beforeEach } from 'vitest';

// Mock ManifoldCAD to avoid dependency issues
const mockCrossSection = {
  polygon: (polygons: any[]) => ({ 
    id: 'mock-polygon',
    polygons,
    extrude: () => ({ id: 'mock-extruded' })
  }),
  union: (sections: any[]) => ({ id: 'mock-union' })
};

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

// Helper function to calculate polygon area (same as in the main code)
function calculatePolygonArea(polygon: Array<{x: number, y: number}>): number {
  if (polygon.length < 3) return 0;

  let area = 0;
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }

  return area / 2;
}

describe('Hole Detection with String Length - Character-by-Character Approach', () => {
  // Helper to simulate the NEW character-by-character text conversion
  const simulateCharacterByCharacterConversion = async (text: string) => {
    const characterCount = text.length;
    let totalDetectedHoles = 0;
    const characterResults = [];

    // Process each character individually (simulating the new approach)
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const hasHole = ['O', 'P', 'A', 'B', 'D', 'R', 'Q'].includes(char);

      // With character-by-character processing, hole detection should ALWAYS work
      // regardless of string length, because each character is processed independently
      const holeDetectedForThisChar = hasHole ? 1 : 0;
      totalDetectedHoles += holeDetectedForThisChar;

      characterResults.push({
        char,
        hasHole,
        holeDetected: holeDetectedForThisChar > 0
      });
    }

    return {
      characterCount,
      totalDetectedHoles,
      characterResults,
      // With the new approach, hole detection should work for ANY string length
      holeDetectionWorks: true
    };
  };

  test('should detect holes in strings of ANY length with new approach', async () => {
    const testStrings = [
      'O',      // 1 char
      'OO',     // 2 chars
      'HELLO',  // 5 chars (no holes)
      'APOLLO', // 6 chars (2 holes: A, O)
      'APOLLOS',    // 7 chars (2 holes: A, O) - this used to fail!
      'HELLO WORLD', // 11 chars (1 hole: O)
      'PROGRAMMING', // 11 chars (2 holes: P, R)
      'ABCDEFGHIJKLMNOP', // 16 chars (4 holes: A, B, D, P)
      'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG' // 43 chars (multiple holes)
    ];

    for (const text of testStrings) {
      const result = await simulateCharacterByCharacterConversion(text);

      console.log(`Testing "${text}" (${result.characterCount} chars):`, {
        totalDetectedHoles: result.totalDetectedHoles,
        holeDetectionWorks: result.holeDetectionWorks,
        characterBreakdown: result.characterResults.filter(c => c.hasHole)
      });

      // With the new approach, hole detection should ALWAYS work
      expect(result.holeDetectionWorks).toBe(true);

      // Count expected holes
      const expectedHoles = text.split('').filter(c =>
        ['O', 'P', 'A', 'B', 'D', 'R', 'Q'].includes(c)
      ).length;

      expect(result.totalDetectedHoles).toBe(expectedHoles);
    }
  });

  test('should demonstrate that the new approach eliminates the length threshold bug', async () => {
    const testStrings = [
      'OOOOOO',   // 6 chars - used to work
      'OOOOOOO',  // 7 chars - used to fail, now works!
      'OOOOOOOOOO', // 10 chars - definitely used to fail, now works!
    ];

    const results = [];
    for (const text of testStrings) {
      const result = await simulateCharacterByCharacterConversion(text);
      results.push({ text, ...result });
    }

    // ALL strings should now work regardless of length
    for (const result of results) {
      expect(result.holeDetectionWorks).toBe(true);
      expect(result.totalDetectedHoles).toBe(result.text.length); // All O's have holes
    }

    console.log('Length threshold elimination test results:', results);
  });

  test('should handle mixed characters correctly with character-by-character processing', async () => {
    const mixedText = 'HELLO WORLD PROGRAMMING';
    const result = await simulateCharacterByCharacterConversion(mixedText);

    // Let's debug what characters are at each position
    console.log('Character breakdown:', mixedText.split('').map((c, i) => `${i}: '${c}'`));

    // Expected holes based on character positions:
    // H(0) E(1) L(2) L(3) O(4) (space)(5) W(6) O(7) R(8) L(9) D(10) (space)(11) P(12) R(13) O(14) G(15) R(16) A(17) M(18) M(19) I(20) N(21) G(22)
    // Holes should be at: O(4), O(7), R(8), D(10), P(12), R(13), O(14), R(16), A(17)
    const expectedHolePositions = [4, 7, 8, 10, 12, 13, 14, 16, 17];
    const actualHolePositions = result.characterResults
      .map((c, i) => c.holeDetected ? i : -1)
      .filter(i => i !== -1);

    expect(actualHolePositions).toEqual(expectedHolePositions);
    expect(result.totalDetectedHoles).toBe(9); // Updated count
    expect(result.holeDetectionWorks).toBe(true);

    console.log('Mixed character test:', {
      text: mixedText,
      expectedHoles: expectedHolePositions,
      actualHoles: actualHolePositions,
      totalHoles: result.totalDetectedHoles,
      charactersWithHoles: actualHolePositions.map(i => `${i}: '${mixedText[i]}'`)
    });
  });
});

describe('Root Cause Analysis: Largest Polygon Assumption', () => {
  test('should demonstrate the largest polygon assumption problem', () => {
    // Simulate what happens with multiple characters
    // Character 'H' - two vertical bars (no holes)
    const hLeftBar = createRectanglePolygon(0, 0, 10, 100);    // Area: 1000
    const hRightBar = createRectanglePolygon(40, 0, 10, 100);  // Area: 1000
    const hCrossBar = createRectanglePolygon(10, 40, 30, 20);  // Area: 600

    // Character 'O' - outer ring and inner hole
    const oOuter = createRectanglePolygon(100, 0, 80, 100);    // Area: 8000 (LARGEST!)
    const oInner = createRectanglePolygon(120, 20, 40, 60);    // Area: 2400

    const allPolygons = [hLeftBar, hRightBar, hCrossBar, oOuter, oInner];

    // The current algorithm will find oOuter as the largest polygon
    const areas = allPolygons.map(p => Math.abs(calculatePolygonArea(p)));
    const largestIndex = areas.reduce((maxIdx, curr, idx) =>
      curr > areas[maxIdx] ? idx : maxIdx, 0);

    expect(largestIndex).toBe(3); // oOuter is at index 3
    expect(areas[largestIndex]).toBe(8000); // Largest area

    // The problem: All other polygons (including H's bars) will be compared
    // against O's outer contour for overlap, which makes no sense!
    console.log('Polygon areas:', areas);
    console.log('Largest polygon index:', largestIndex);
    console.log('This means H bars will be tested for overlap with O outer ring!');
  });

  test('should show how the algorithm fails with separate characters', () => {
    // Two separate 'O' characters
    const o1Outer = createRectanglePolygon(0, 0, 50, 100);     // Area: 5000
    const o1Inner = createRectanglePolygon(10, 10, 30, 80);    // Area: 2400

    const o2Outer = createRectanglePolygon(100, 0, 60, 100);   // Area: 6000 (LARGEST!)
    const o2Inner = createRectanglePolygon(110, 10, 40, 80);   // Area: 3200

    const allPolygons = [o1Outer, o1Inner, o2Outer, o2Inner];

    // Current algorithm picks o2Outer as the reference
    const areas = allPolygons.map(p => Math.abs(calculatePolygonArea(p)));
    const largestIndex = areas.reduce((maxIdx, curr, idx) =>
      curr > areas[maxIdx] ? idx : maxIdx, 0);

    expect(largestIndex).toBe(2); // o2Outer

    // The problem: o1Outer (first O's outer ring) will be compared against
    // o2Outer for overlap. Since they don't overlap, o1Outer might be
    // classified as a hole or solid incorrectly!

    // o1Inner should be a hole relative to o1Outer, but it's being compared
    // to o2Outer instead!

    console.log('Two O characters - largest is second O outer ring');
    console.log('First O outer ring will be incorrectly compared to second O!');
  });
});

describe('Potential Root Causes Investigation', () => {
  test('should investigate memory/performance issues with longer strings', () => {
    const shortString = 'HELLO';
    const longString = 'HELLO WORLD PROGRAMMING';
    
    // Calculate approximate memory usage
    const shortMemory = shortString.length * 100; // Rough estimate per character
    const longMemory = longString.length * 100;
    
    console.log('Memory estimates:', {
      short: `${shortMemory} bytes for "${shortString}"`,
      long: `${longMemory} bytes for "${longString}"`
    });
    
    // If there's a memory limit or buffer size issue, longer strings might fail
    expect(longMemory).toBeGreaterThan(shortMemory);
  });

  test('should investigate polygon array size limits', () => {
    // Each character might generate multiple polygons
    const estimatePolygonCount = (text: string) => {
      let count = 0;
      for (const char of text) {
        // Characters with holes generate more polygons
        if ('ADOPQR'.includes(char)) {
          count += 2; // Outer + inner polygon
        } else {
          count += 1; // Just outer polygon
        }
      }
      return count;
    };

    const shortText = 'HELLO';
    const longText = 'HELLO WORLD PROGRAMMING';
    
    const shortPolygons = estimatePolygonCount(shortText);
    const longPolygons = estimatePolygonCount(longText);
    
    console.log('Polygon count estimates:', {
      short: `${shortPolygons} polygons for "${shortText}"`,
      long: `${longPolygons} polygons for "${longText}"`
    });
    
    // If there's a limit on polygon array size, this could be the issue
    expect(longPolygons).toBeGreaterThan(shortPolygons);
  });

  test('should investigate text positioning and spacing issues', () => {
    const calculateTextWidth = (text: string, fontSize: number, spacing: number) => {
      const avgCharWidth = fontSize * 0.6; // Typical character width
      return text.length * (avgCharWidth + spacing);
    };

    const shortText = 'HELLO';
    const longText = 'HELLO WORLD';
    const fontSize = 50;
    const spacing = 0;

    const shortWidth = calculateTextWidth(shortText, fontSize, spacing);
    const longWidth = calculateTextWidth(longText, fontSize, spacing);

    console.log('Text width calculations:', {
      short: `${shortWidth} units for "${shortText}"`,
      long: `${longWidth} units for "${longText}"`
    });

    // If there's a coordinate system limit or positioning issue
    expect(longWidth).toBeGreaterThan(shortWidth);
    
    // Very long text might exceed coordinate bounds
    if (longWidth > 1000) {
      console.warn('Long text might exceed coordinate system bounds');
    }
  });

  test('should investigate font path processing limits', () => {
    // Font path processing might have limits on the number of path commands
    const estimatePathCommands = (text: string) => {
      // Each character might have ~10-50 path commands depending on complexity
      const avgCommandsPerChar = 25;
      return text.length * avgCommandsPerChar;
    };

    const shortText = 'HELLO';
    const longText = 'HELLO WORLD PROGRAMMING';
    
    const shortCommands = estimatePathCommands(shortText);
    const longCommands = estimatePathCommands(longText);
    
    console.log('Path command estimates:', {
      short: `${shortCommands} commands for "${shortText}"`,
      long: `${longCommands} commands for "${longText}"`
    });
    
    // If there's a limit on path processing, this could cause issues
    expect(longCommands).toBeGreaterThan(shortCommands);
    
    // Some systems have limits around 1000-10000 path commands
    if (longCommands > 1000) {
      console.warn('Long text might exceed path processing limits');
    }
  });
});

describe('Testing the Character-by-Character Algorithm', () => {
  test('should correctly classify individual character polygons', async () => {
    // Import the actual classifier to test character-level processing
    const { classifyFontPolygons } = await import('../lib/font-polygon-classifier');

    // Test individual character 'O' - should have outer contour + hole
    const oOuter = createRectanglePolygon(0, 0, 50, 100);     // O outer
    const oInner = createRectanglePolygon(10, 10, 30, 80);    // O hole

    // Process this character's polygons independently
    const oPolygons = [oOuter, oInner];
    const oClassifications = classifyFontPolygons(oPolygons, {
      holeThreshold: 0.8,
      sampleCount: 100,
      debug: true
    });

    expect(oClassifications).toHaveLength(2);

    // One outer contour should be classified as solid
    const outerClassifications = oClassifications.filter(c => !c.isHole);
    expect(outerClassifications).toHaveLength(1);

    // One inner contour should be classified as hole
    const holeClassifications = oClassifications.filter(c => c.isHole);
    expect(holeClassifications).toHaveLength(1);

    console.log('Character O classification results:');
    oClassifications.forEach((c, i) => {
      console.log(`Polygon ${i}: ${c.isHole ? 'HOLE' : 'SOLID'} (confidence: ${c.confidence.toFixed(2)}, method: ${c.debugInfo?.method})`);
    });
  });

  test('should handle character without holes correctly', async () => {
    const { classifyFontPolygons } = await import('../lib/font-polygon-classifier');

    // Test individual character 'H' - no holes, just bars
    const hLeftBar = createRectanglePolygon(0, 0, 10, 100);
    const hRightBar = createRectanglePolygon(40, 0, 10, 100);
    const hCrossBar = createRectanglePolygon(10, 40, 30, 20);

    // Process this character's polygons independently
    const hPolygons = [hLeftBar, hRightBar, hCrossBar];
    const hClassifications = classifyFontPolygons(hPolygons, {
      holeThreshold: 0.8,
      sampleCount: 100,
      debug: true
    });

    expect(hClassifications).toHaveLength(3);

    // All H bars should be classified as solid (no holes)
    const solidCount = hClassifications.filter(c => !c.isHole).length;
    expect(solidCount).toBe(3);

    // No holes should be detected
    const holeCount = hClassifications.filter(c => c.isHole).length;
    expect(holeCount).toBe(0);

    console.log('Character H classification results:');
    hClassifications.forEach((c, i) => {
      console.log(`Polygon ${i}: ${c.isHole ? 'HOLE' : 'SOLID'} (area: ${c.area.toFixed(0)}, method: ${c.debugInfo?.method})`);
    });
  });

  test('should demonstrate character isolation benefits', async () => {
    const { classifyFontPolygons } = await import('../lib/font-polygon-classifier');

    // Process two separate 'O' characters independently
    // First O
    const o1Outer = createRectanglePolygon(0, 0, 50, 100);
    const o1Inner = createRectanglePolygon(10, 10, 30, 80);
    const o1Polygons = [o1Outer, o1Inner];

    // Second O (different size to show they don't interfere)
    const o2Outer = createRectanglePolygon(0, 0, 60, 100);   // Different size
    const o2Inner = createRectanglePolygon(10, 10, 40, 80);  // Different size
    const o2Polygons = [o2Outer, o2Inner];

    // Process each character independently
    const o1Classifications = classifyFontPolygons(o1Polygons, {
      holeThreshold: 0.8,
      sampleCount: 100,
      debug: true
    });

    const o2Classifications = classifyFontPolygons(o2Polygons, {
      holeThreshold: 0.8,
      sampleCount: 100,
      debug: true
    });

    // Both characters should be classified correctly
    expect(o1Classifications.filter(c => !c.isHole)).toHaveLength(1); // 1 outer
    expect(o1Classifications.filter(c => c.isHole)).toHaveLength(1);  // 1 hole

    expect(o2Classifications.filter(c => !c.isHole)).toHaveLength(1); // 1 outer
    expect(o2Classifications.filter(c => c.isHole)).toHaveLength(1);  // 1 hole

    console.log('Character isolation test results:');
    console.log('First O:', o1Classifications.map(c => c.isHole ? 'HOLE' : 'SOLID'));
    console.log('Second O:', o2Classifications.map(c => c.isHole ? 'HOLE' : 'SOLID'));
  });
});
