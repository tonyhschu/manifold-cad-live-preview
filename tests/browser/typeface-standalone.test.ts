import { describe, it, expect, afterAll } from 'vitest';

describe('Typeface standalone capabilities in real browser', () => {
  afterAll(async () => {
    const { fonts } = await import('@manifold-studio/typeface');
    fonts.reset();
  });

  it('initializes fonts and loads Inter from CDN', async () => {
    const { fonts } = await import('@manifold-studio/typeface');

    await fonts.ensureReady();

    expect(fonts.isReady()).toBe(true);
    expect(fonts.list()).toContain('Inter');
    expect(fonts.isFontLoaded('Inter')).toBe(true);
  });

  it('renders text to a CrossSection with nonzero area', async () => {
    const { fontLoader, fonts } = await import('@manifold-studio/typeface');
    await fonts.ensureReady();

    const renderText = fontLoader('Inter');
    const crossSection = renderText('HELLO', { fontSize: 24 });

    expect(crossSection).toBeDefined();
    expect(crossSection.area()).toBeGreaterThan(0);
  });

  it('extrudes text CrossSection to 3D with vertices and triangles', async () => {
    const { fontLoader, fonts } = await import('@manifold-studio/typeface');
    await fonts.ensureReady();

    const renderText = fontLoader('Inter');
    const crossSection = renderText('HELLO', { fontSize: 24 });
    const text3D = crossSection.extrude(10);

    const mesh = text3D.getMesh();
    expect(mesh.vertProperties.length).toBeGreaterThan(0);
    expect(mesh.triVerts.length).toBeGreaterThan(0);
  });

  it('exports extruded text to a valid GLB blob', async () => {
    const { fontLoader, fonts } = await import('@manifold-studio/typeface');
    const { manifoldToGLB } = await import('@manifold-studio/wrapper');
    await fonts.ensureReady();

    const renderText = fontLoader('Inter');
    const crossSection = renderText('HELLO', { fontSize: 24 });
    const text3D = crossSection.extrude(10);

    const blob = await manifoldToGLB(text3D);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe('model/gltf-binary');
  });
});
