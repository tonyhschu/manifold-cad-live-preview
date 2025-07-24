/**
 * Wheel Component - V3 Version
 *
 * A parametric wheel model with tire and rim.
 * Adapted for V3 pipeline architecture.
 */

import { Manifold } from '@manifold-studio/wrapper';
import { P, createConfig } from '@manifold-studio/wrapper';

// Export parametric config using proper wrapper API
export default createConfig(
  {
    radius: P.number(15, 5, 30, 1),
    width: P.number(4, 1, 10, 0.1),
    rimRatio: P.number(0.7, 0.3, 0.9, 0.01)
  },
  ({ radius, width, rimRatio }) => {
  console.log('🔧 Building wheel with:', { radius, width, rimRatio });

  // Create tire (outer cylinder)
  const tire = Manifold.cylinder(width, radius, radius);

  // Create rim (inner cylinder, slightly shorter and smaller)
  const rimRadius = radius * rimRatio;
  const rimWidth = width * 0.8;
  const rim = Manifold.cylinder(rimWidth, rimRadius, rimRadius);

  // Create wheel by subtracting rim from tire
  return tire.subtract(rim);
},
{
  name: "V3 Wheel Component",
  description: "A customizable wheel with tire and rim - now with V3 live updates!"
});
