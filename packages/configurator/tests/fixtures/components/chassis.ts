// Test fixture: components/chassis.ts - Static model for testing
// Mock Manifold object for testing
class MockManifold {
  constructor(public data: any) {}
  static cube(dimensions: number[]): MockManifold {
    return new MockManifold({ type: 'cube', dimensions });
  }
  translate(offset: number[]): MockManifold {
    return new MockManifold({ type: 'translate', geometry: this.data, offset });
  }
  subtract(other: MockManifold): MockManifold {
    return new MockManifold({ type: 'subtract', operands: [this.data, other.data] });
  }
}

export const modelMetadata = {
  name: 'Chassis Component',
  type: 'static' as const
};

export default function createModel(): MockManifold {
  // Create a simple chassis shape (rectangular frame)
  const outer = MockManifold.cube([100, 50, 10]);
  const inner = MockManifold.cube([80, 30, 12]).translate([10, 10, -1]);
  return outer.subtract(inner);
}
