import { Manifold } from '@manifold-studio/wrapper';

export default {
  parameters: {
    radius: { value: 15, min: 5, max: 50, step: 1 },
    height: { value: 20, min: 5, max: 100, step: 1 },
    segments: { value: 16, min: 3, max: 64, step: 1 }
  },
  generateModel: (params: {
    radius: number;
    height: number;
    segments: number;
  }) => {
    return Manifold.cylinder(params.height, params.radius, params.radius, params.segments);
  },
  name: "Test Cylinder",
  description: "A simple parametric cylinder for testing"
};
