// Example component - you can create additional models here
import { Manifold, P, createConfig } from "@manifold-studio/wrapper";

// Export parametric config as default for UI compatibility
export default createConfig(
  {
    radius: P.number(10, 1, 50, 1)
  },
  (params) => Manifold.sphere(params.radius),
  {
    name: "Simple Sphere",
    description: "A basic sphere component"
  }
);
