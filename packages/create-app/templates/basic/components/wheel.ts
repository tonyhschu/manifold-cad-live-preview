// Wheel component - demonstrates parametric modeling
import { Manifold, P, createConfig } from "@manifold-studio/wrapper";

// Export parametric config as default for UI compatibility
export default createConfig(
  {
    radius: P.number(5, 2, 20, 0.5),
    width: P.number(2, 1, 10, 0.5)
  },
  (params) => {
    const tire = Manifold.cylinder(params.width, params.radius, params.radius);
    const rim = Manifold.cylinder(params.width * 0.8, params.radius * 0.7, params.radius * 0.7);
    return Manifold.difference(tire, rim);
  },
  {
    name: "Wheel Component",
    description: "A customizable wheel with tire and rim"
  }
);
