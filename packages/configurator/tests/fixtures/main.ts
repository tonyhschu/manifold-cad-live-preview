// Test fixture: main.ts - Parametric model for testing
// Mock Manifold object for testing
class MockManifold {
  constructor(public data: any) {}
  static cube(dimensions: number[]): MockManifold {
    return new MockManifold({ type: 'cube', dimensions });
  }
}

export interface TestBoxConfig {
  width: number;
  height: number;
  depth: number;
}

function createTestBox(config: TestBoxConfig): MockManifold {
  return MockManifold.cube([config.width, config.height, config.depth]);
}

// Export parametric config as default (matching the expected structure)
export default {
  name: 'Test Box',
  parameters: {
    width: { type: 'number' as const, default: 10, min: 1, max: 100 },
    height: { type: 'number' as const, default: 10, min: 1, max: 100 },
    depth: { type: 'number' as const, default: 10, min: 1, max: 100 }
  },
  generateModel: (params: TestBoxConfig) => createTestBox(params)
};

export const modelMetadata = {
  name: 'Test Box',
  type: 'parametric' as const
};
