// Wheel component - demonstrates parametric modeling
import { Manifold, P, createConfig } from "@manifold-studio/wrapper";

/**
 * Creates a wheel component with tire and rim
 */
function createWheel(radius: number = 5, width: number = 2): Manifold {
  const tire = Manifold.cylinder(width, radius, radius);
  const rim = Manifold.cylinder(width * 0.8, radius * 0.7, radius * 0.7);
  return Manifold.difference(tire, rim);
}

// Export the pure function as default for pipeline compatibility
export default createWheel;

// Keep the parametric config for UI compatibility
export const wheelConfig = createConfig(
  {
    radius: P.number(5, 2, 20, 0.5),
    width: P.number(2, 1, 10, 0.5)
  },
  (params) => createWheel(params.radius, params.width),
  {
    name: "Wheel Component",
    description: "A customizable wheel with tire and rim"
  }
);

// Also export the pure function by name
export { createWheel };
