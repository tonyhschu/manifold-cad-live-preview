/**
 * Font Polygon Classification Utility
 * 
 * This utility provides a clean interface for classifying font polygons as either
 * holes (to be subtracted) or solid parts (to be added/unioned). The implementation
 * can be swapped out without changing calling code.
 * 
 * Current implementation uses sampling-based overlap detection.
 */

// Type definitions
interface Vec2 {
  x: number;
  y: number;
}

interface Polygon extends Array<Vec2> {}

export interface PolygonClassification {
  index: number;
  polygon: Polygon;
  area: number;
  isHole: boolean;
  confidence: number; // 0-1, how confident we are in the classification
  debugInfo?: {
    overlapRatio?: number;
    method?: string;
    sampleCount?: number;
  };
}

/**
 * Main classification function with stable interface
 * 
 * @param polygons Array of polygons to classify
 * @param options Optional configuration for the classifier
 * @returns Array of classifications, one per input polygon
 */
export function classifyFontPolygons(
  polygons: Polygon[],
  options: {
    holeThreshold?: number; // Overlap ratio threshold for hole detection (default: 0.9)
    sampleCount?: number;   // Number of sample points for overlap estimation (default: 100)
    debug?: boolean;        // Include debug information in results (default: false)
  } = {}
): PolygonClassification[] {
  const {
    holeThreshold = 0.9,
    sampleCount = 100,
    debug = false
  } = options;

  if (polygons.length === 0) {
    return [];
  }

  if (polygons.length === 1) {
    // Single polygon is always solid
    return [{
      index: 0,
      polygon: polygons[0],
      area: Math.abs(calculatePolygonArea(polygons[0])),
      isHole: false,
      confidence: 1.0,
      debugInfo: debug ? { method: 'single-polygon' } : undefined
    }];
  }

  // Multiple polygons - use overlap-based classification
  return classifyWithOverlapSampling(polygons, holeThreshold, sampleCount, debug);
}

/**
 * Implementation using sampling-based overlap detection
 */
function classifyWithOverlapSampling(
  polygons: Polygon[],
  holeThreshold: number,
  sampleCount: number,
  debug: boolean
): PolygonClassification[] {
  const classifications: PolygonClassification[] = polygons.map((polygon, index) => ({
    index,
    polygon,
    area: Math.abs(calculatePolygonArea(polygon)),
    isHole: false,
    confidence: 0,
    debugInfo: debug ? {} : undefined
  }));

  // Find the largest polygon (likely the outer contour)
  const largestIndex = classifications.reduce((maxIdx, curr, idx) => 
    curr.area > classifications[maxIdx].area ? idx : maxIdx, 0);

  // Classify each polygon based on its overlap with the largest polygon
  for (let i = 0; i < classifications.length; i++) {
    if (i === largestIndex) {
      // Largest polygon is always solid
      classifications[i].isHole = false;
      classifications[i].confidence = 1.0;
      if (debug) {
        classifications[i].debugInfo!.method = 'largest-polygon';
      }
    } else {
      // Calculate overlap with largest polygon
      const overlapRatio = estimateOverlapWithSampling(
        classifications[i].polygon,
        classifications[largestIndex].polygon,
        sampleCount
      );
      
      classifications[i].isHole = overlapRatio >= holeThreshold;
      classifications[i].confidence = overlapRatio >= holeThreshold ? 
        Math.min(overlapRatio / holeThreshold, 1.0) : 
        Math.min((1 - overlapRatio) / (1 - holeThreshold), 1.0);
      
      if (debug) {
        classifications[i].debugInfo!.overlapRatio = overlapRatio;
        classifications[i].debugInfo!.method = 'overlap-sampling';
        classifications[i].debugInfo!.sampleCount = sampleCount;
      }
    }
  }

  return classifications;
}

/**
 * Estimate overlap between two polygons using random sampling
 */
function estimateOverlapWithSampling(
  smallerPoly: Polygon,
  largerPoly: Polygon,
  sampleCount: number
): number {
  if (sampleCount <= 0) return 0;

  let overlapCount = 0;
  let validSamples = 0;

  // Generate random points within the smaller polygon and test if they're in the larger polygon
  for (let i = 0; i < sampleCount * 2 && validSamples < sampleCount; i++) {
    const samplePoint = generateRandomPointInPolygon(smallerPoly);
    if (samplePoint) {
      validSamples++;
      if (isPointInPolygon(samplePoint, largerPoly)) {
        overlapCount++;
      }
    }
  }

  return validSamples > 0 ? overlapCount / validSamples : 0;
}

/**
 * Generate a random point within a polygon using rejection sampling
 */
function generateRandomPointInPolygon(polygon: Polygon): Vec2 | null {
  if (polygon.length < 3) return null;

  const bbox = getBoundingBox(polygon);
  const maxAttempts = 50; // Prevent infinite loops

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const point: Vec2 = {
      x: bbox.minX + Math.random() * (bbox.maxX - bbox.minX),
      y: bbox.minY + Math.random() * (bbox.maxY - bbox.minY)
    };

    if (isPointInPolygon(point, polygon)) {
      return point;
    }
  }

  return null; // Failed to find a point within the polygon
}

/**
 * Test if a point is inside a polygon using ray casting algorithm
 */
function isPointInPolygon(point: Vec2, polygon: Polygon): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  const { x, y } = point;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Calculate the bounding box of a polygon
 */
function getBoundingBox(polygon: Polygon): { minX: number; minY: number; maxX: number; maxY: number } {
  if (polygon.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = polygon[0].x;
  let minY = polygon[0].y;
  let maxX = polygon[0].x;
  let maxY = polygon[0].y;

  for (let i = 1; i < polygon.length; i++) {
    const { x, y } = polygon[i];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Calculate signed area of a polygon using shoelace formula
 * Positive area = counter-clockwise, negative area = clockwise
 */
function calculatePolygonArea(polygon: Polygon): number {
  if (polygon.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }
  return area / 2;
}
