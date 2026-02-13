import { describe, it, expect } from 'vitest';

describe('ManifoldCAD WASM in real browser', () => {
  it('initializes WASM and creates geometry', async () => {
    const { Manifold } = await import('@manifold-studio/wrapper');

    expect(Manifold).toBeDefined();

    const cube = Manifold.cube([10, 10, 10]);
    const mesh = cube.getMesh();
    expect(mesh.vertProperties.length).toBeGreaterThan(0);
    expect(mesh.triVerts.length).toBeGreaterThan(0);
  });
});
