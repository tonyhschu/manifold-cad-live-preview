// Text to CrossSection Converter using OpenType.js for Manifold Studio
// This implementation converts text strings to ManifoldCAD CrossSection objects

import { Manifold, CrossSection, createConfig, P } from '@manifold-studio/wrapper';
import opentype from 'opentype.js';
import { fontResolver, type LoadedFont } from '../lib/font-resolver';
import { classifyFontPolygons } from '../lib/font-polygon-classifier';

// Type definitions for our implementation
interface Vec2 {
  x: number;
  y: number;
}

interface Polygon extends Array<Vec2> {}

interface CrossSectionPolygons extends Array<Polygon> {}

/**
 * Calculate signed area of a polygon using shoelace formula
 * Positive area = counter-clockwise, negative area = clockwise
 */
function calculatePolygonArea(polygon: Polygon): number {
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }
  return area / 2;
}

// Removed isPointInPolygon and isPolygonContained functions - now handled by font-polygon-classifier utility

/**
 * Text to CrossSection Converter Class
 * Handles loading fonts and converting text to vector paths suitable for ManifoldCAD
 */
class TextToCrossSection {
  private loadedFont: LoadedFont | null = null;
  private fontLoaded = false;

  constructor() {}

  /**
   * Check if a font is loaded
   */
  get isFontLoaded(): boolean {
    return this.fontLoaded;
  }

  /**
   * Load a font by name using FontResolver
   */
  async loadFont(fontName: string): Promise<void> {
    try {
      console.log(`Loading font: ${fontName}`);
      this.loadedFont = await fontResolver.loadFont(fontName);
      this.fontLoaded = true;
      console.log(`Font '${fontName}' loaded successfully`);
    } catch (error) {
      console.error(`Failed to load font '${fontName}':`, error);
      throw error;
    }
  }

  /**
   * Load a default font (Inter Variable Font) with fallback
   */
  async loadDefaultFont(): Promise<void> {
    try {
      console.log('Loading default font (Inter Variable Font)');
      await this.loadFont('Inter Variable Font');
      console.log('Default font loaded successfully');
    } catch (error) {
      console.warn('Failed to load default font, using fallback mode:', error);
      // Set fallback mode
      this.fontLoaded = true;
      this.loadedFont = null;
      console.log('Fallback mode activated');
    }
  }

  /**
   * Convert a text string to CrossSection polygons
   */
  textToCrossSection(
    text: string,
    fontSize: number = 100,
    options: {
      spacing?: number;
      kerning?: boolean;
      features?: { [key: string]: boolean };
    } = {}
  ): CrossSectionPolygons {
    if (!this.fontLoaded) {
      throw new Error('Font not loaded. Call loadFont() or loadDefaultFont() first.');
    }

    if (!this.loadedFont) {
      // Fallback to simple shapes when no font is loaded
      return this.createFallbackText(text, fontSize, options.spacing || 0);
    }

    const { spacing = 0, kerning = true, features = { liga: true } } = options;

    // Get the path for the entire text string
    const path = this.loadedFont.font.getPath(text, 0, 0, fontSize, { features });

    console.log('=== OPENTYPE PATH ANALYSIS ===');
    console.log('Path object:', path);
    console.log('Path commands:', path.commands);
    console.log('Path commands length:', path.commands.length);

    // Analyze each command
    path.commands.forEach((cmd: any, i: number) => {
      console.log(`  Command ${i}: type=${cmd.type}, x=${cmd.x}, y=${cmd.y}`);
      if (cmd.x1 !== undefined) console.log(`    Control points: x1=${cmd.x1}, y1=${cmd.y1}, x2=${cmd.x2}, y2=${cmd.y2}`);
    });

    // Check if there are any path properties that indicate contour direction
    console.log('Path fill:', path.fill);
    console.log('Path stroke:', path.stroke);
    console.log('Path strokeWidth:', path.strokeWidth);
    console.log('Path other properties:', Object.keys(path));

    // Investigate individual command metadata
    console.log('=== COMMAND-LEVEL METADATA ===');
    path.commands.forEach((cmd: any, i: number) => {
      const cmdProps = Object.keys(cmd);
      if (cmdProps.length > 3) { // More than just type, x, y
        console.log(`  Command ${i} (${cmd.type}): properties =`, cmdProps, 'values =', cmd);
      }
    });

    // Also analyze individual glyphs for metadata
    console.log('=== GLYPH ANALYSIS ===');
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const glyph = this.loadedFont.font.charToGlyph(char);
      console.log(`Character "${char}":`);
      console.log('  Glyph object:', glyph);
      console.log('  Glyph properties:', Object.keys(glyph));
      console.log('  Glyph path:', glyph.path);
      console.log('  Glyph path commands:', glyph.path?.commands?.length || 0);

      // Check for additional glyph metadata that might indicate fill/hole semantics
      console.log('  Glyph detailed properties:');
      ['index', 'name', 'unicode', 'unicodes', 'advanceWidth', 'leftSideBearing', 'path'].forEach(prop => {
        if (glyph[prop] !== undefined) {
          console.log(`    ${prop}:`, glyph[prop]);
        }
      });

      // Check if there are any path-level properties beyond commands
      if (glyph.path) {
        console.log('  Path properties:', Object.keys(glyph.path));
        ['fill', 'stroke', 'strokeWidth', 'fillRule', 'clipRule', 'opacity'].forEach(prop => {
          if (glyph.path[prop] !== undefined) {
            console.log(`    path.${prop}:`, glyph.path[prop]);
          }
        });
      }

      // Check if glyph has any contour information
      if (glyph.path && glyph.path.commands) {
        console.log('  Path commands breakdown:');
        let contourCount = 0;
        glyph.path.commands.forEach((cmd: any, cmdIndex: number) => {
          if (cmd.type === 'M') contourCount++;
          console.log(`    ${cmdIndex}: ${cmd.type} (${cmd.x}, ${cmd.y})`);
        });
        console.log(`  Total contours (M commands): ${contourCount}`);
      }
    }
    console.log('=== END GLYPH ANALYSIS ===');
    console.log('=== END OPENTYPE PATH ANALYSIS ===');

    // Convert the OpenType path to polygon arrays
    const polygons = this.convertPathToPolygons(path, fontSize);

    return polygons;
  }

  /**
   * Create fallback text using simple shapes when no font is available
   */
  private createFallbackText(text: string, fontSize: number, spacing: number): CrossSectionPolygons {
    console.log(`Creating fallback text for: "${text}" with fontSize: ${fontSize}`);
    const polygons: CrossSectionPolygons = [];
    const charWidth = fontSize * 0.6;
    const charHeight = fontSize;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const x = i * (charWidth + spacing);

      if (char === ' ') continue; // Skip spaces

      // Create letter-like shapes based on the character
      const charPolygons = this.createFallbackCharacter(char, x, 0, charWidth, charHeight);
      polygons.push(...charPolygons);
    }

    console.log(`Generated ${polygons.length} polygons for fallback text`);
    return polygons;
  }

  /**
   * Create simple letter-like shapes for fallback rendering
   */
  private createFallbackCharacter(char: string, x: number, y: number, width: number, height: number): Polygon[] {
    const polygons: Polygon[] = [];
    const strokeWidth = width * 0.15;

    switch (char.toUpperCase()) {
      case 'H':
        // Left vertical bar
        polygons.push([
          { x: x, y: y },
          { x: x + strokeWidth, y: y },
          { x: x + strokeWidth, y: y + height },
          { x: x, y: y + height }
        ]);
        // Right vertical bar
        polygons.push([
          { x: x + width - strokeWidth, y: y },
          { x: x + width, y: y },
          { x: x + width, y: y + height },
          { x: x + width - strokeWidth, y: y + height }
        ]);
        // Horizontal bar
        polygons.push([
          { x: x + strokeWidth, y: y + height * 0.4 },
          { x: x + width - strokeWidth, y: y + height * 0.4 },
          { x: x + width - strokeWidth, y: y + height * 0.6 },
          { x: x + strokeWidth, y: y + height * 0.6 }
        ]);
        break;

      case 'E':
        // Left vertical bar
        polygons.push([
          { x: x, y: y },
          { x: x + strokeWidth, y: y },
          { x: x + strokeWidth, y: y + height },
          { x: x, y: y + height }
        ]);
        // Top horizontal bar
        polygons.push([
          { x: x, y: y + height - strokeWidth },
          { x: x + width, y: y + height - strokeWidth },
          { x: x + width, y: y + height },
          { x: x, y: y + height }
        ]);
        // Middle horizontal bar
        polygons.push([
          { x: x, y: y + height * 0.4 },
          { x: x + width * 0.8, y: y + height * 0.4 },
          { x: x + width * 0.8, y: y + height * 0.6 },
          { x: x, y: y + height * 0.6 }
        ]);
        // Bottom horizontal bar
        polygons.push([
          { x: x, y: y },
          { x: x + width, y: y },
          { x: x + width, y: y + strokeWidth },
          { x: x, y: y + strokeWidth }
        ]);
        break;

      case 'L':
        // Vertical bar
        polygons.push([
          { x: x, y: y },
          { x: x + strokeWidth, y: y },
          { x: x + strokeWidth, y: y + height },
          { x: x, y: y + height }
        ]);
        // Bottom horizontal bar
        polygons.push([
          { x: x, y: y },
          { x: x + width, y: y },
          { x: x + width, y: y + strokeWidth },
          { x: x, y: y + strokeWidth }
        ]);
        break;

      case 'O':
        // Outer rectangle
        const outerPoly: Polygon = [
          { x: x, y: y },
          { x: x + width, y: y },
          { x: x + width, y: y + height },
          { x: x, y: y + height }
        ];
        // Inner rectangle (hole)
        const innerPoly: Polygon = [
          { x: x + strokeWidth, y: y + strokeWidth },
          { x: x + strokeWidth, y: y + height - strokeWidth },
          { x: x + width - strokeWidth, y: y + height - strokeWidth },
          { x: x + width - strokeWidth, y: y + strokeWidth }
        ];
        polygons.push(outerPoly, innerPoly);
        break;

      default:
        // Default rectangular shape for unknown characters
        polygons.push([
          { x: x, y: y },
          { x: x + width, y: y },
          { x: x + width, y: y + height },
          { x: x, y: y + height }
        ]);
        break;
    }

    return polygons;
  }

  /**
   * Convert OpenType.js Path to polygon arrays
   */
  private convertPathToPolygons(path: opentype.Path, fontSize: number): CrossSectionPolygons {
    const polygons: CrossSectionPolygons = [];
    let currentContour: Polygon = [];
    let startPoint: Vec2 | null = null;

    for (const cmd of path.commands) {
      switch (cmd.type) {
        case 'M': // Move to
          if (currentContour.length > 0) {
            // Close previous contour if it exists
            if (startPoint && this.distanceToStart(currentContour, startPoint) < 1) {
              currentContour.push(startPoint);
            }
            polygons.push([...currentContour]);
          }
          startPoint = { x: cmd.x, y: this.flipY(cmd.y, fontSize) };
          currentContour = [startPoint];
          break;

        case 'L': // Line to
          currentContour.push({
            x: cmd.x,
            y: this.flipY(cmd.y, fontSize)
          });
          break;

        case 'C': // Cubic Bezier curve
          const cubicPoints = this.subdivideCubicBezier(
            currentContour[currentContour.length - 1],
            { x: cmd.x1, y: this.flipY(cmd.y1, fontSize) },
            { x: cmd.x2, y: this.flipY(cmd.y2, fontSize) },
            { x: cmd.x, y: this.flipY(cmd.y, fontSize) },
            20 // subdivision steps
          );
          currentContour.push(...cubicPoints.slice(1)); // Skip first point (duplicate)
          break;

        case 'Q': // Quadratic Bezier curve
          const quadPoints = this.subdivideQuadraticBezier(
            currentContour[currentContour.length - 1],
            { x: cmd.x1, y: this.flipY(cmd.y1, fontSize) },
            { x: cmd.x, y: this.flipY(cmd.y, fontSize) },
            15 // subdivision steps
          );
          currentContour.push(...quadPoints.slice(1)); // Skip first point (duplicate)
          break;

        case 'Z': // Close path
          if (currentContour.length > 2 && startPoint) {
            // Close the contour by connecting back to start
            if (this.distanceToStart(currentContour, startPoint) > 1) {
              currentContour.push(startPoint);
            }
            polygons.push([...currentContour]);
          }
          currentContour = [];
          startPoint = null;
          break;
      }
    }

    // Handle any remaining unclosed contour
    if (currentContour.length > 2) {
      if (startPoint && this.distanceToStart(currentContour, startPoint) > 1) {
        currentContour.push(startPoint);
      }
      polygons.push(currentContour);
    }

    return this.processPolygons(polygons);
  }

  /**
   * Flip Y coordinate since fonts use bottom-left origin but we want top-left
   */
  private flipY(y: number, fontSize: number): number {
    return fontSize - y;
  }

  /**
   * Calculate distance from last point to start point
   */
  private distanceToStart(contour: Polygon, startPoint: Vec2): number {
    if (contour.length === 0) return Infinity;
    const lastPoint = contour[contour.length - 1];
    return Math.sqrt(
      Math.pow(lastPoint.x - startPoint.x, 2) + Math.pow(lastPoint.y - startPoint.y, 2)
    );
  }

  /**
   * Subdivide cubic Bezier curve into line segments
   */
  private subdivideCubicBezier(
    p0: Vec2,
    p1: Vec2,
    p2: Vec2,
    p3: Vec2,
    steps: number
  ): Vec2[] {
    const points: Vec2[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x =
        Math.pow(1 - t, 3) * p0.x +
        3 * Math.pow(1 - t, 2) * t * p1.x +
        3 * (1 - t) * Math.pow(t, 2) * p2.x +
        Math.pow(t, 3) * p3.x;
      const y =
        Math.pow(1 - t, 3) * p0.y +
        3 * Math.pow(1 - t, 2) * t * p1.y +
        3 * (1 - t) * Math.pow(t, 2) * p2.y +
        Math.pow(t, 3) * p3.y;
      points.push({ x, y });
    }
    return points;
  }

  /**
   * Subdivide quadratic Bezier curve into line segments
   */
  private subdivideQuadraticBezier(p0: Vec2, p1: Vec2, p2: Vec2, steps: number): Vec2[] {
    const points: Vec2[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.pow(1 - t, 2) * p0.x + 2 * (1 - t) * t * p1.x + Math.pow(t, 2) * p2.x;
      const y = Math.pow(1 - t, 2) * p0.y + 2 * (1 - t) * t * p1.y + Math.pow(t, 2) * p2.y;
      points.push({ x, y });
    }
    return points;
  }



  /**
   * Process polygons to handle holes and winding order
   */
  private processPolygons(polygons: CrossSectionPolygons): CrossSectionPolygons {
    // Calculate winding order and separate outer contours from holes
    const processedPolygons: CrossSectionPolygons = [];

    for (const polygon of polygons) {
      if (polygon.length < 3) continue; // Skip degenerate polygons

      // Calculate signed area to determine winding order
      const signedArea = this.calculateSignedArea(polygon);

      // For fonts, outer contours are typically counter-clockwise (negative area)
      // and holes are clockwise (positive area)
      if (signedArea < 0) {
        // Outer contour - keep as is
        processedPolygons.push(polygon);
      } else {
        // Hole - reverse winding order to make it counter-clockwise
        processedPolygons.push([...polygon].reverse());
      }
    }

    return processedPolygons;
  }

  /**
   * Calculate signed area of polygon (positive = clockwise, negative = counter-clockwise)
   */
  private calculateSignedArea(polygon: Polygon): number {
    let area = 0;
    const n = polygon.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += polygon[i].x * polygon[j].y;
      area -= polygon[j].x * polygon[i].y;
    }

    return area / 2;
  }

  /**
   * Get the currently loaded font
   */
  getLoadedFont(): LoadedFont | null {
    return this.loadedFont;
  }

  /**
   * Get font metrics for layout calculations
   */
  getMetrics(): { unitsPerEm: number; ascender: number; descender: number } | null {
    if (!this.loadedFont) return null;

    return {
      unitsPerEm: this.loadedFont.font.unitsPerEm,
      ascender: this.loadedFont.font.ascender,
      descender: this.loadedFont.font.descender
    };
  }

  /**
   * Convert to ManifoldCAD CrossSection format
   * This converts our Vec2 format to the number[][] format expected by ManifoldCAD
   */
  toManifoldPolygons(polygons: CrossSectionPolygons): number[][][] {
    return polygons.map(polygon =>
      polygon.map(point => [point.x, point.y])
    );
  }
}

// Create a global instance of the text converter
const textConverter = new TextToCrossSection();

// Test font loading function
async function testFontLoading(): Promise<string> {
  console.log('=== Font Loading Test ===');
  console.log('Available fonts:', fontResolver.getAvailableFonts());

  try {
    await textConverter.loadDefaultFont();
    console.log('✅ Font loading test passed');

    // Test font metrics if loaded
    const metrics = textConverter.getMetrics();
    if (metrics) {
      console.log('📊 Font metrics:', metrics);
      return `✅ Font loaded successfully! Metrics: unitsPerEm=${metrics.unitsPerEm}, ascender=${metrics.ascender}`;
    } else {
      console.log('📊 Using fallback rendering (no font metrics)');
      return '⚠️ Using fallback rendering - no font loaded';
    }
  } catch (error) {
    console.error('❌ Font loading test failed:', error);
    return `❌ Font loading failed: ${error.message}`;
  } finally {
    console.log('=== End Font Loading Test ===');
  }
}

// Global variable to store font loading status
let fontLoadingStatus = 'Loading...';

// Initialize with default font and run test - use top-level await
fontLoadingStatus = await testFontLoading();

/**
 * Create extruded text using the TextToCrossSection converter
 * TODO: Add dynamic font loading based on fontName parameter
 */

function createExtrudedText(
  text: string = "Hello",
  height: number = 10,
  fontSize: number = 50,
  spacing: number = 0,
  fontName: string = "Inter Variable Font"
): typeof Manifold {
  console.log(`🎯 Creating extruded text: "${text}", height: ${height}, fontSize: ${fontSize}, spacing: ${spacing}, font: ${fontName}`);
  console.log(`🔍 Font loaded status: ${textConverter.isFontLoaded}`);
  console.log(`🔍 Available fonts: ${fontResolver.getAvailableFonts().join(', ')}`);

  try {
    // Check if font is loaded, if not, ensure it's loaded
    if (!textConverter.isFontLoaded) {
      console.warn('⚠️ Font not loaded yet, using geometric fallback');
      const fallback = createGeometricFallback(text, height, fontSize, spacing);
      console.log(`✅ Geometric fallback created:`, typeof fallback, fallback.constructor.name);
      return fallback;
    }

    console.log(`✅ Font is loaded, proceeding with font-based rendering`);

    // Try to use the actual font conversion first
    const polygons = textConverter.textToCrossSection(text, fontSize, { spacing });
    console.log(`📐 Generated ${polygons.length} polygons from font conversion`);

    if (polygons.length > 0) {
      console.log(`🔄 Converting ${polygons.length} polygons to ManifoldCAD format`);
      console.log(`📊 Raw polygons from font:`, polygons.map(p => p.length));

      console.log('=== DETAILED POLYGON ANALYSIS ===');
      for (let i = 0; i < polygons.length; i++) {
        const polygon = polygons[i];
        const area = calculatePolygonArea(polygon);
        const windingDirection = area > 0 ? 'CCW (SOLID)' : 'CW (HOLE)';
        console.log(`  Polygon ${i}: ${polygon.length} points, area=${area.toFixed(2)} (${windingDirection})`);

        // Show first few points to understand the shape
        const first5Points = polygon.slice(0, 5);
        console.log(`    First 5 points:`, first5Points.map(p => `[${p.x.toFixed(1)}, ${p.y.toFixed(1)}]`).join(', '));

        // Show DETAILED coordinate sequence for winding analysis
        console.log(`    DETAILED COORDINATE SEQUENCE (first 8 points):`);
        for (let j = 0; j < Math.min(8, polygon.length); j++) {
          const curr = polygon[j];
          const next = polygon[(j + 1) % polygon.length];
          const dx = next.x - curr.x;
          const dy = next.y - curr.y;
          console.log(`      ${j}: [${curr.x.toFixed(2)}, ${curr.y.toFixed(2)}] → [${next.x.toFixed(2)}, ${next.y.toFixed(2)}] (Δx=${dx.toFixed(2)}, Δy=${dy.toFixed(2)})`);
        }

        // Manual winding calculation step-by-step for verification
        console.log(`    MANUAL WINDING CALCULATION:`);
        let manualArea = 0;
        for (let j = 0; j < Math.min(4, polygon.length); j++) {
          const curr = polygon[j];
          const next = polygon[(j + 1) % polygon.length];
          const crossProduct = curr.x * next.y - next.x * curr.y;
          manualArea += crossProduct;
          console.log(`      Step ${j}: (${curr.x.toFixed(2)} * ${next.y.toFixed(2)}) - (${next.x.toFixed(2)} * ${curr.y.toFixed(2)}) = ${crossProduct.toFixed(2)}, running sum = ${manualArea.toFixed(2)}`);
        }
        console.log(`    Manual area (first 4 steps): ${(manualArea / 2).toFixed(2)}, Full area: ${area.toFixed(2)}`);

        // Calculate bounding box to understand size/position
        const minX = Math.min(...polygon.map(p => p.x));
        const maxX = Math.max(...polygon.map(p => p.x));
        const minY = Math.min(...polygon.map(p => p.y));
        const maxY = Math.max(...polygon.map(p => p.y));
        const width = maxX - minX;
        const height = maxY - minY;
        console.log(`    Bounding box: [${minX.toFixed(1)}, ${minY.toFixed(1)}] to [${maxX.toFixed(1)}, ${maxY.toFixed(1)}], size: ${width.toFixed(1)} x ${height.toFixed(1)}`);
      }
      console.log('=== END DETAILED ANALYSIS ===');

      // Convert to ManifoldCAD format using overlap-based classification
      console.log('🔧 Using overlap-based polygon classification...');

      // Classify polygons using our utility
      const classifications = classifyFontPolygons(polygons, {
        holeThreshold: 0.9,  // 90% overlap threshold for hole detection
        sampleCount: 100,    // Number of sample points for overlap estimation
        debug: true          // Include debug information
      });

      console.log('📊 Classification results:');
      classifications.forEach((classification, i) => {
        console.log(`  Polygon ${i}: ${classification.isHole ? 'HOLE' : 'SOLID'} (confidence: ${(classification.confidence * 100).toFixed(1)}%, area: ${classification.area.toFixed(2)})`);
        if (classification.debugInfo?.overlapRatio !== undefined) {
          console.log(`    Overlap ratio: ${(classification.debugInfo.overlapRatio * 100).toFixed(1)}%`);
        }
      });

      // Convert classifications to ManifoldCAD format with proper winding order
      const finalPolygons = classifications.map((classification, i) => {
        const polygon = classification.polygon;
        const area = calculatePolygonArea(polygon);
        const coords = polygon.map(point => [point.x, point.y] as [number, number]);

        if (classification.isHole) {
          // This is a hole - make it clockwise
          console.log(`  Polygon ${i}: hole, making clockwise (area=${area.toFixed(2)})`);
          return area > 0 ? coords.reverse() : coords; // Make clockwise
        } else {
          // This is a solid part - make it counter-clockwise
          console.log(`  Polygon ${i}: solid, making counter-clockwise (area=${area.toFixed(2)})`);
          return area < 0 ? coords.reverse() : coords; // Make counter-clockwise
        }
      });

      console.log(`🔧 Creating CrossSection with ${finalPolygons.length} polygons (1 outer + ${finalPolygons.length - 1} holes)...`);
      const crossSection = new CrossSection(finalPolygons);
      console.log(`✅ CrossSection created: isEmpty=${crossSection.isEmpty()}, numContour=${crossSection.numContour()}, numVert=${crossSection.numVert()}`);
      console.log(`✅ Created CrossSection from font polygons:`, typeof crossSection, crossSection.constructor.name);

      // Extrude to create 3D text
      const testCrossSection = CrossSection.square([10, 10]);
      const testExtruded = Manifold.extrude(testCrossSection , height);

      const extruded = Manifold.extrude(crossSection, height);

      console.log(`✅ Extruded font-based text to 3D:`, extruded, extruded.constructor.name);
      console.log(`   Test extrusion:`, testExtruded, testExtruded.constructor.name);

      console.log('--- Debugging Output ---');
      console.log('testCrossSection', testCrossSection.isEmpty());
      console.log('testExtruded status', testExtruded.status());
      console.log('crossSection', crossSection.isEmpty());
      console.log('extruded status', extruded.status());

      return extruded;
    //   return testExtruded;
    }

    // If no polygons from font, fall back to geometric shapes
    console.log('⚠️ No font polygons available, using geometric fallback');
    const fallback = createGeometricFallback(text, height, fontSize, spacing);
    console.log(`✅ Geometric fallback created:`, typeof fallback, fallback.constructor.name);
    return fallback;

  } catch (error) {
    console.error('❌ Error in font-based text creation:', error);
    console.log('🔄 Falling back to geometric shapes');
    const fallback = createGeometricFallback(text, height, fontSize, spacing);
    console.log(`✅ Error fallback created:`, typeof fallback, fallback.constructor.name);
    return fallback;
  }
}

/**
 * Create geometric fallback shapes when font loading fails
 */
function createGeometricFallback(
  text: string,
  height: number,
  fontSize: number,
  spacing: number
): typeof Manifold {
  console.log(`🔧 Creating geometric fallback for: "${text}", height: ${height}, fontSize: ${fontSize}, spacing: ${spacing}`);

  try {
    const letterShapes: any[] = [];
    const charWidth = fontSize * 0.6;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === ' ') continue;

      const x = i * (charWidth + spacing);

      // Create a simple shape for each character
      let letterShape: any;

      switch (char.toUpperCase()) {
        case 'H':
          // Create H shape using rectangles
          const leftBar = CrossSection.square([fontSize * 0.1, fontSize]).translate([x, 0]);
          const rightBar = CrossSection.square([fontSize * 0.1, fontSize]).translate([x + charWidth - fontSize * 0.1, 0]);
          const crossBar = CrossSection.square([charWidth * 0.8, fontSize * 0.1]).translate([x + fontSize * 0.1, fontSize * 0.45]);
          letterShape = CrossSection.union([leftBar, rightBar, crossBar]);
          break;

        case 'E':
          // Create E shape
          const vertBar = CrossSection.square([fontSize * 0.1, fontSize]).translate([x, 0]);
          const topBar = CrossSection.square([charWidth, fontSize * 0.1]).translate([x, fontSize * 0.9]);
          const midBar = CrossSection.square([charWidth * 0.8, fontSize * 0.1]).translate([x, fontSize * 0.45]);
          const botBar = CrossSection.square([charWidth, fontSize * 0.1]).translate([x, 0]);
          letterShape = CrossSection.union([vertBar, topBar, midBar, botBar]);
          break;

        case 'L':
          // Create L shape
          const vBar = CrossSection.square([fontSize * 0.1, fontSize]).translate([x, 0]);
          const hBar = CrossSection.square([charWidth, fontSize * 0.1]).translate([x, 0]);
          letterShape = CrossSection.union([vBar, hBar]);
          break;

        case 'O':
          // Create O shape (square with hole)
          const outer = CrossSection.square([charWidth, fontSize]).translate([x, 0]);
          const inner = CrossSection.square([charWidth * 0.6, fontSize * 0.6]).translate([x + charWidth * 0.2, fontSize * 0.2]);
          letterShape = outer.subtract(inner);
          break;

        default:
          // Default rectangle for unknown characters
          letterShape = CrossSection.square([charWidth, fontSize]).translate([x, 0]);
          break;
      }

      letterShapes.push(letterShape);
    }

    console.log(`Created ${letterShapes.length} geometric letter shapes`);

    if (letterShapes.length === 0) {
      console.log('No letter shapes created, returning placeholder');
      return Manifold.cube([fontSize, fontSize, height], true);
    }

    // Union all letter shapes
    const textShape = letterShapes.length === 1 ? letterShapes[0] : CrossSection.union(letterShapes);
    console.log('Unioned all geometric letter shapes');

    // Extrude to create 3D text
    const extruded = textShape.extrude(height);
    console.log(`✅ Extruded geometric text shape to 3D:`, typeof extruded, extruded.constructor.name);

    return extruded;
  } catch (error) {
    console.error('❌ Error creating geometric fallback:', error);
    // Final fallback - simple cube
    const cube = Manifold.cube([text.length * fontSize * 0.6, fontSize, height], true);
    console.log(`✅ Final cube fallback created:`, typeof cube, cube.constructor.name);
    return cube;
  }
}

// Export the parametric config as the default export
const typefaceConfig = createConfig(
  {
    text: P.string('O'),
    height: P.number(10, 1, 50, 1),
    fontSize: P.number(50, 10, 200, 5),
    spacing: P.number(0, -10, 50, 1),
    fontName: P.select('Inter Variable Font', fontResolver.getAvailableFonts())
  },
  (params: { text: string; height: number; fontSize: number; spacing: number; fontName: string }) =>
    createExtrudedText(params.text, params.height, params.fontSize, params.spacing, params.fontName),
  {
    name: 'Typeface',
    description: `Convert text to 3D extruded shapes with font loading from CDN. Status: ${fontLoadingStatus}`
  }
);

export default typefaceConfig;