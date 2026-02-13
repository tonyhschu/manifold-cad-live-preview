import { describe, it, expect } from 'vitest';

describe('ManifoldCAD WASM standalone capabilities', () => {
  it('exports a cube to GLB with correct MIME type and non-zero size', async () => {
    const { Manifold, manifoldToGLB } = await import('@manifold-studio/wrapper');

    const cube = Manifold.cube([10, 10, 10]);
    const blob = await manifoldToGLB(cube);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe('model/gltf-binary');
  });

  it('creates a blob URL from a GLB blob', async () => {
    const { Manifold, manifoldToGLB } = await import('@manifold-studio/wrapper');

    const cube = Manifold.cube([5, 5, 5]);
    const blob = await manifoldToGLB(cube);
    const url = URL.createObjectURL(blob);

    expect(typeof url).toBe('string');
    expect(url.startsWith('blob:')).toBe(true);

    URL.revokeObjectURL(url);
  });

  it('performs boolean union on two overlapping shapes', async () => {
    const { Manifold } = await import('@manifold-studio/wrapper');

    const cubeA = Manifold.cube([10, 10, 10]);
    const cubeB = Manifold.cube([10, 10, 10]).translate([5, 5, 5]);
    const result = cubeA.add(cubeB);

    const mesh = result.getMesh();
    expect(mesh.vertProperties.length).toBeGreaterThan(0);
    expect(mesh.triVerts.length).toBeGreaterThan(0);
  });

  it('uses createConfig with P.number to build and invoke a parametric model', async () => {
    const { Manifold, createConfig, P } = await import('@manifold-studio/wrapper');

    const config = createConfig(
      {
        width: P.number(10, 1, 50),
        height: P.number(20, 1, 50),
        depth: P.number(5, 1, 50),
      },
      (params) => Manifold.cube([params.width, params.height, params.depth]),
      { name: 'Parametric Box' }
    );

    expect(config.name).toBe('Parametric Box');
    expect(typeof config.generateModel).toBe('function');

    const model = config.generateModel({ width: 15, height: 25, depth: 8 });
    const mesh = model.getMesh();
    expect(mesh.vertProperties.length).toBeGreaterThan(0);
    expect(mesh.triVerts.length).toBeGreaterThan(0);
  });
});
