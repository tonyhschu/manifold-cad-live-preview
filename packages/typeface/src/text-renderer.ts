/**
 * Text Renderer - Convert text to 3D CrossSection using fonts
 * 
 * This module handles the conversion of text strings to 2D polygon arrays
 * that can be used with ManifoldCAD's CrossSection for 3D extrusion.
 */

import { CrossSection } from '@manifold-studio/wrapper';
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
): CrossSection {
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

  console.log(`🔤 Text "${text}" generated ${polygons.length} polygons`);

  if (polygons.length === 0) {
    console.log('⚠️ No polygons generated, returning empty CrossSection');
    // Return empty CrossSection for empty text
    return new CrossSection();
  }

  // Classify polygons to determine holes
  const classifications = classifyFontPolygons(polygons);
  console.log(`🔍 Classified ${classifications.length} polygons: ${classifications.filter(c => !c.isHole).length} solids, ${classifications.filter(c => c.isHole).length} holes`);
  
  // Build CrossSection from classified polygons
  console.log('🏗️ Building CrossSection from classified polygons...');

  if (classifications.length === 0) {
    console.log('⚠️ No polygons to process, returning empty CrossSection');
    return new CrossSection([]);
  }

  // Use the original working approach: single CrossSection with all polygons
  // Apply correct winding order based on hole classification
  console.log('🏗️ Using original approach: single CrossSection with proper winding order');

  const allPolygons: [number, number][][] = [];

  for (let i = 0; i < classifications.length; i++) {
    const classification = classifications[i];

    console.log(`🔧 Processing polygon ${i + 1}/${classifications.length}: ${classification.polygon.length} points, isHole: ${classification.isHole}`);

    // Validate polygon data
    if (!classification.polygon || classification.polygon.length < 3) {
      console.warn(`⚠️ Skipping invalid polygon ${i + 1}: insufficient points`);
      continue;
    }

    // Check for undefined points
    const hasUndefinedPoints = classification.polygon.some(point => !point || point.x === undefined || point.y === undefined);
    if (hasUndefinedPoints) {
      console.warn(`⚠️ Skipping polygon ${i + 1}: contains undefined points`);
      continue;
    }

    // Convert Vec2[] format to [number, number][] format
    let manifoldPolygon = classification.polygon.map(point => [point.x, point.y] as [number, number]);

    // Apply winding order correction based on original working implementation:
    // - Holes should be clockwise (negative area)
    // - Solids should be counter-clockwise (positive area)
    const signedArea = calculateSignedArea(manifoldPolygon);
    const isCounterClockwise = signedArea > 0;

    console.log(`🔄 Polygon ${i + 1}: ${isCounterClockwise ? 'CCW' : 'CW'}, signed area: ${signedArea.toFixed(2)}, isHole: ${classification.isHole}`);

    if (classification.isHole) {
      // Holes should be clockwise (negative area)
      if (isCounterClockwise) {
        manifoldPolygon.reverse();
        console.log(`🔄 Reversed hole polygon ${i + 1} to clockwise`);
      }
    } else {
      // Solids should be counter-clockwise (positive area)
      if (!isCounterClockwise) {
        manifoldPolygon.reverse();
        console.log(`🔄 Reversed solid polygon ${i + 1} to counter-clockwise`);
      }
    }

    allPolygons.push(manifoldPolygon);
    console.log(`✅ Added polygon ${i + 1} with correct winding order`);
  }

  if (allPolygons.length === 0) {
    console.log('⚠️ No valid polygons to process, returning empty CrossSection');
    return new CrossSection([]);
  }

  console.log(`🏗️ Creating single CrossSection with ${allPolygons.length} properly-wound polygons`);
  // If no valid polygons were processed, return empty CrossSection
  if (allPolygons.length === 0) {
    console.log('⚠️ No valid polygons processed, returning empty CrossSection');
    return new CrossSection([]);
  }

  // Create single CrossSection with all properly-wound polygons (original working approach)
  let result = new CrossSection(allPolygons);
  console.log(`✅ CrossSection created with ${allPolygons.length} polygons`);

  // Apply horizontal alignment
  if (align !== 'left') {
    const bounds = result.bounds();
    const width = bounds.max.x - bounds.min.x;
    
    let offsetX = 0;
    if (align === 'center') {
      offsetX = -width / 2;
    } else if (align === 'right') {
      offsetX = -width;
    }
    
    if (offsetX !== 0) {
      result = result.translate([offsetX, 0]);
    }
  }

  // Debug the final result
  console.log('🎯 Final CrossSection created');
  try {
    const area = result.area ? result.area() : 'unknown';
    const numVert = result.numVert ? result.numVert() : 'unknown';
    console.log(`📊 CrossSection stats: area=${area}, vertices=${numVert}`);
  } catch (statsError) {
    const errorMessage = statsError instanceof Error ? statsError.message : String(statsError);
    console.log('⚠️ Could not get CrossSection stats:', errorMessage);
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
        currentPolygon.push({ x: command.x, y: command.y });
        break;

      case 'L': // Line to
        currentPolygon.push({ x: command.x, y: command.y });
        break;

      case 'Q': // Quadratic curve
        const quadPoints = subdivideQuadratic(
          currentPolygon[currentPolygon.length - 1],
          { x: command.x1, y: command.y1 },
          { x: command.x, y: command.y },
          subdivisionSteps
        );
        currentPolygon.push(...quadPoints.slice(1)); // Skip first point (already in polygon)
        break;

      case 'C': // Cubic curve
        const cubicPoints = subdivideCubic(
          currentPolygon[currentPolygon.length - 1],
          { x: command.x1, y: command.y1 },
          { x: command.x2, y: command.y2 },
          { x: command.x, y: command.y },
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
