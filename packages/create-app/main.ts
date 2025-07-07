/**
 * Main Parametric Model - Parametric Box
 * 
 * A simple parametric box model for testing the V3 pipeline.
 */

import { Manifold } from '@manifold-studio/wrapper';

export default {
  name: 'Parametric Box',
  description: 'A simple parametric box with configurable dimensions',
  parameters: {
    width: { value: 10, min: 1, max: 50 },
    height: { value: 10, min: 1, max: 50 },
    depth: { value: 10, min: 1, max: 50 },
    cornerRadius: { value: 0, min: 0, max: 5 },
    wallThickness: { value: 0, min: 0, max: 2 },
    hasLid: { value: false }
  },
  generateModel(params: any) {
    const { width, height, depth, cornerRadius, wallThickness, hasLid } = params;
    
    // Create the main box
    let box = Manifold.cube([width, height, depth], true);
    
    // Apply corner radius if specified
    if (cornerRadius > 0) {
      // Simple approach: create rounded corners by subtracting corner cylinders
      // This is a simplified implementation - real corner rounding would be more complex
      const cornerCyl = Manifold.cylinder(cornerRadius, height + 1);
      
      // Position corner cylinders at the corners and subtract them
      // This is a basic implementation - you could make this more sophisticated
      box = box.subtract(
        cornerCyl.translate([width/2 - cornerRadius, height/2 - cornerRadius, -0.5])
      );
    }
    
    // Create hollow interior if wall thickness is specified
    if (wallThickness > 0) {
      const innerWidth = width - 2 * wallThickness;
      const innerHeight = height - 2 * wallThickness;
      const innerDepth = depth - wallThickness; // Leave bottom solid
      
      if (innerWidth > 0 && innerHeight > 0 && innerDepth > 0) {
        const innerBox = Manifold.cube([innerWidth, innerHeight, innerDepth], true)
          .translate([0, 0, wallThickness]);
        box = box.subtract(innerBox);
      }
    }
    
    // Add lid if requested
    if (hasLid && wallThickness > 0) {
      const lidThickness = Math.max(wallThickness, 1);
      const lid = Manifold.cube([width, height, lidThickness], true)
        .translate([0, 0, depth + lidThickness/2]);
      box = box.union(lid);
    }
    
    return box;
  }
};
