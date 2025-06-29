// Test fixture: components/wheel.ts - Static model for testing
// Mock Manifold object for testing
class MockManifold {
  constructor(public data: any) {}
  static cylinder(radius: number, height: number): MockManifold {
    return new MockManifold({ type: 'cylinder', radius, height });
  }
  subtract(other: MockManifold): MockManifold {
    return new MockManifold({ type: 'subtract', operands: [this.data, other.data] });
  }
}

export const modelMetadata = {
  name: 'Wheel Component',
  type: 'static' as const
};

export default function createModel(): MockManifold {
  // Create a simple wheel shape (cylinder with a hole)
  const outer = MockManifold.cylinder(20, 5);
  const inner = MockManifold.cylinder(8, 6);
  return outer.subtract(inner);
}
