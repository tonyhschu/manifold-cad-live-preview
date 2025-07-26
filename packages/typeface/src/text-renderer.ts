/**
 * Text Renderer - Convert text to 3D CrossSection using fonts
 * 
 * This module handles the conversion of text strings to 2D polygon arrays
 * that can be used with ManifoldCAD's CrossSection for 3D extrusion.
 */

import { CrossSection, type CrossSectionType } from '@manifold-studio/wrapper';
import type { LoadedFont } from './font-resolver.js';
import { classifyFontPolygons } from './font-polygon-classifier.js';
import { fontRegistry } from './font-registry.js';

// Type definitions
interface Vec2 {
  x: number;
  y: number;
}

interface Polygon extends Array<Vec2> {}

/**
 * Text rendering options
 */
export interface TextRenderOptions {
  /** Font size in units */
  fontSize?: number;
  /** Letter spacing multiplier (1.0 = normal) */
  letterSpacing?: number;
  /** Horizontal alignment */
  align?: 'left' | 'center' | 'right';
  /** Bezier curve subdivision steps */
  subdivisionSteps?: number;
}

/**
 * Convert text to CrossSection using a loaded font
 */
export function textToCrossSection(
  text: string, 
  fontName: string, 
  options: TextRenderOptions = {}
): CrossSectionType {
  const {
    fontSize = 12,
    letterSpacing = 1.0,
    align = 'left',
    subdivisionSteps = 10
  } = options;

  // Get the loaded font
  const loadedFont = fontRegistry.getFont(fontName);
  if (!loadedFont) {
    throw new Error(
      `Font '${fontName}' not loaded. Available fonts: ${fontRegistry.list().join(', ')}`
    );
  }

  // Convert text to polygons
  const polygons = textToPolygons(text, loadedFont, fontSize, letterSpacing, subdivisionSteps);

  if (polygons.length === 0) {
    // Return empty CrossSection for empty text
    return new CrossSection([]);
  }

  // Classify polygons to determine holes
  const classifications = classifyFontPolygons(polygons);

  if (classifications.length === 0) {
    return new CrossSection([]);
  }

  // Use the original working approach: single CrossSection with all polygons
  // Apply correct winding order based on hole classification

  const allPolygons: [number, number][][] = [];

  for (let i = 0; i < classifications.length; i++) {
    const classification = classifications[i];

    // Validate polygon data
    if (!classification.polygon || classification.polygon.length < 3) {
      continue;
    }

    // Check for undefined points
    const hasUndefinedPoints = classification.polygon.some(point => !point || point.x === undefined || point.y === undefined);
    if (hasUndefinedPoints) {
      continue;
    }

    // Convert Vec2[] format to [number, number][] format
    let manifoldPolygon = classification.polygon.map(point => [point.x, point.y] as [number, number]);

    // Apply winding order correction based on original working implementation:
    // - Holes should be clockwise (negative area)
    // - Solids should be counter-clockwise (positive area)
    const signedArea = calculateSignedArea(manifoldPolygon);
    const isCounterClockwise = signedArea > 0;

    if (classification.isHole) {
      // Holes should be clockwise (negative area)
      if (isCounterClockwise) {
        manifoldPolygon.reverse();
      }
    } else {
      // Solids should be counter-clockwise (positive area)
      if (!isCounterClockwise) {
        manifoldPolygon.reverse();
      }
    }

    allPolygons.push(manifoldPolygon);
  }

  if (allPolygons.length === 0) {
    return new CrossSection([]);
  }

  // Create single CrossSection with all properly-wound polygons (original working approach)

  // Use actual font polygons now that we fixed the alignment issue
  let result = new CrossSection(allPolygons);

  // Apply horizontal alignment (with proper error handling)
  if (align !== 'left') {
    try {
      const bounds = result.bounds();
      // bounds.min and bounds.max are arrays, not objects with x/y properties
      const width = bounds.max[0] - bounds.min[0];

      if (isNaN(width) || !isFinite(width)) {
        // Skip alignment if width is invalid
      } else {
        let offsetX = 0;
        if (align === 'center') {
          offsetX = -width / 2;
        } else if (align === 'right') {
          offsetX = -width;
        }

        if (offsetX !== 0 && isFinite(offsetX)) {
          result = result.translate([offsetX, 0]);
        }
      }
    } catch (boundsError) {
      // Skip alignment if bounds calculation fails
    }
  }

  return result;
}

/**
 * Calculate signed area of a polygon using shoelace formula
 * Positive area = counter-clockwise, negative area = clockwise
 */
function calculateSignedArea(polygon: [number, number][]): number {
  if (polygon.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += polygon[i][0] * polygon[j][1];
    area -= polygon[j][0] * polygon[i][1];
  }
  return area / 2;
}

/**
 * Convert text string to polygon arrays using OpenType.js
 */
function textToPolygons(
  text: string,
  loadedFont: LoadedFont,
  fontSize: number,
  letterSpacing: number,
  subdivisionSteps: number
): Polygon[] {
  const font = loadedFont.font;
  const scale = fontSize / font.unitsPerEm;
  
  let currentX = 0;
  const allPolygons: Polygon[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // Skip spaces
    if (char === ' ') {
      const spaceWidth = font.charToGlyph(' ').advanceWidth || font.unitsPerEm * 0.25;
      currentX += spaceWidth * scale * letterSpacing;
      continue;
    }

    // Get glyph for character
    const glyph = font.charToGlyph(char);
    if (!glyph) {
      console.warn(`Glyph not found for character: ${char}`);
      continue;
    }

    // Get glyph path
    const path = glyph.getPath(currentX, 0, fontSize);
    
    // Convert path to polygons
    const glyphPolygons = pathToPolygons(path, subdivisionSteps);
    allPolygons.push(...glyphPolygons);

    // Advance position
    const advanceWidth = glyph.advanceWidth || 0;
    currentX += advanceWidth * scale * letterSpacing;
  }

  return allPolygons;
}

/**
 * Convert OpenType.js Path to polygon arrays
 */
function pathToPolygons(path: any, subdivisionSteps: number): Polygon[] {
  const polygons: Polygon[] = [];
  let currentPolygon: Polygon = [];

  // Process path commands
  for (const command of path.commands) {
    switch (command.type) {
      case 'M': // Move to
        if (currentPolygon.length > 0) {
          polygons.push([...currentPolygon]);
          currentPolygon = [];
        }
        currentPolygon.push({ x: command.x, y: -command.y }); // Flip Y axis
        break;

      case 'L': // Line to
        currentPolygon.push({ x: command.x, y: -command.y }); // Flip Y axis
        break;

      case 'Q': // Quadratic curve
        const quadPoints = subdivideQuadratic(
          currentPolygon[currentPolygon.length - 1],
          { x: command.x1, y: -command.y1 }, // Flip Y axis
          { x: command.x, y: -command.y }, // Flip Y axis
          subdivisionSteps
        );
        currentPolygon.push(...quadPoints.slice(1)); // Skip first point (already in polygon)
        break;

      case 'C': // Cubic curve
        const cubicPoints = subdivideCubic(
          currentPolygon[currentPolygon.length - 1],
          { x: command.x1, y: -command.y1 }, // Flip Y axis
          { x: command.x2, y: -command.y2 }, // Flip Y axis
          { x: command.x, y: -command.y }, // Flip Y axis
          subdivisionSteps
        );
        currentPolygon.push(...cubicPoints.slice(1)); // Skip first point (already in polygon)
        break;

      case 'Z': // Close path
        if (currentPolygon.length > 2) {
          polygons.push([...currentPolygon]);
        }
        currentPolygon = [];
        break;
    }
  }

  // Add final polygon if not closed
  if (currentPolygon.length > 2) {
    polygons.push(currentPolygon);
  }

  return polygons;
}

/**
 * Subdivide quadratic Bezier curve
 */
function subdivideQuadratic(p0: Vec2, p1: Vec2, p2: Vec2, steps: number): Vec2[] {
  const points: Vec2[] = [];
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
    const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
    points.push({ x, y });
  }
  
  return points;
}

/**
 * Subdivide cubic Bezier curve
 */
function subdivideCubic(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, steps: number): Vec2[] {
  const points: Vec2[] = [];
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = (1 - t) ** 3 * p0.x + 3 * (1 - t) ** 2 * t * p1.x + 
              3 * (1 - t) * t ** 2 * p2.x + t ** 3 * p3.x;
    const y = (1 - t) ** 3 * p0.y + 3 * (1 - t) ** 2 * t * p1.y + 
              3 * (1 - t) * t ** 2 * p2.y + t ** 3 * p3.y;
    points.push({ x, y });
  }
  
  return points;
}
