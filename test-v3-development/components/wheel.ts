/**
 * Wheel Component - V3 Version
 *
 * A parametric wheel model with tire and rim.
 * Adapted for V3 pipeline architecture.
 */

// Export parametric config directly (no imports needed)
export default {
  name: "V3 Wheel Component",
  description: "A customizable wheel with tire and rim - now with V3 live updates!",
  parameters: {
    radius: {
      value: 105,
      min: 5,
      max: 30
    },
    width: {
      value: 4,
      min: 1,
      max: 10
    },
    rimRatio: {
      value: 0.7,
      min: 0.3,
      max: 0.9
    }
  },
  generateModel: (params: any) => {
    const { radius, width, rimRatio } = params;

    // Get manifold from global
    const manifold = (globalThis as any).manifold;
    if (!manifold) {
      throw new Error('Manifold not available');
    }

    // Create tire (outer cylinder)
    const tire = manifold.cylinder(width, radius, radius);

    // Create rim (inner cylinder, slightly shorter and smaller)
    const rimRadius = radius * rimRatio;
    const rimWidth = width * 0.8;
    const rim = manifold.cylinder(rimWidth, rimRadius, rimRadius);

    // Create wheel by subtracting rim from tire
    return manifold.difference([tire, rim]);
  }
};
