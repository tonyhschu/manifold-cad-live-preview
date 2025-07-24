// Example component - you can create additional models here
import { Manifold, P, createConfig } from "@manifold-studio/wrapper";

/**
 * Creates a simple sphere component
 */
function createSphere(radius: number = 10): Manifold {
  return Manifold.sphere(radius);
}

// Export the pure function as default for pipeline compatibility
export default createSphere;

// Keep the parametric config for UI compatibility
export const sphereConfig = createConfig(
  {
    radius: P.number(10, 1, 50, 1)
  },
  (params) => createSphere(params.radius),
  {
    name: "Simple Sphere",
    description: "A basic sphere component"
  }
);

// Also export the pure function by name
export { createSphere };
