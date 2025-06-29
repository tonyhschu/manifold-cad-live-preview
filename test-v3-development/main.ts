/**
 * Test V3 Development - Main Model
 *
 * Simple parametric model for testing V3 pipeline compilation.
 */

// Export parametric config directly (no imports needed)
export default {
  name: "V3 Test Hook",
  description: "A simple parametric hook for testing V3 architecture - Fresh restart test!",
  parameters: {
    height: {
      value: 10,
      min: 1,
      max: 50
    },
    width: {
      value: 10,
      min: 1,
      max: 20
    },
    thickness: {
      value: 2,
      min: 0.5,
      max: 5
    }
  },
  generateModel: (params: any) => {
    const { height, width, thickness } = params;

    // Simple hook shape using manifold operations
    const manifold = (globalThis as any).manifold;
    if (!manifold) {
      throw new Error('Manifold not available');
    }

    // Create a simple L-shaped hook
    const vertical = manifold.cube([thickness, thickness, height]);
    const horizontal = manifold.cube([width, thickness, thickness])
      .translate([0, 0, height - thickness]);

    console.log('🔧 USER PIPELINE: Returning model - pre GLB');
    // return manifold.union([vertical, horizontal]);
    // return vertical;
    return horizontal;
  }
};
