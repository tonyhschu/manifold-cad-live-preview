import { describe, it, expect, afterEach } from 'vitest';
import type { Pane as PaneType } from 'tweakpane';

describe('complete render loop — Tweakpane → model → GLB → model-viewer', () => {
  let pane: PaneType | null = null;
  let tweakpaneContainer: HTMLDivElement | null = null;
  let viewerContainer: HTMLDivElement | null = null;
  let viewer: HTMLElement | null = null;
  const blobUrls: string[] = [];

  afterEach(() => {
    // Dispose Tweakpane
    if (pane) {
      pane.dispose();
      pane = null;
    }
    // Remove DOM elements
    if (tweakpaneContainer) {
      tweakpaneContainer.remove();
      tweakpaneContainer = null;
    }
    if (viewerContainer) {
      viewerContainer.remove();
      viewerContainer = null;
    }
    viewer = null;
    // Revoke all blob URLs
    for (const url of blobUrls) {
      URL.revokeObjectURL(url);
    }
    blobUrls.length = 0;
  });

  it('complete render loop — Tweakpane params → model → GLB → model-viewer', async () => {
    // 1. Import everything
    const { Manifold, manifoldToGLB } = await import('@manifold-studio/wrapper');
    const { Pane } = await import('tweakpane');
    await import('@google/model-viewer');

    // 2. Setup DOM — two containers
    tweakpaneContainer = document.createElement('div');
    viewerContainer = document.createElement('div');
    document.body.appendChild(tweakpaneContainer);
    document.body.appendChild(viewerContainer);

    // 3. Define a parametric model function
    function generateModel(params: { width: number; height: number; depth: number }) {
      return Manifold.cube([params.width, params.height, params.depth]);
    }

    // 4. Mount Tweakpane with parameter bindings
    const params = { width: 10, height: 10, depth: 10 };
    pane = new Pane({ container: tweakpaneContainer });
    pane.addBinding(params, 'width', { min: 1, max: 100, step: 1 });
    pane.addBinding(params, 'height', { min: 1, max: 100, step: 1 });
    pane.addBinding(params, 'depth', { min: 1, max: 100, step: 1 });

    // Verify Tweakpane mounted
    expect(tweakpaneContainer.children.length).toBeGreaterThan(0);

    // 5. Create model-viewer element in its container
    viewer = document.createElement('model-viewer');
    viewer.setAttribute('style', 'width: 300px; height: 300px;');
    viewerContainer.appendChild(viewer);
    expect(document.body.contains(viewer)).toBe(true);

    // 6. Run initial render: generateModel → manifoldToGLB → blob URL → model-viewer.src
    const model = generateModel(params);
    const blob = await manifoldToGLB(model);
    const url = URL.createObjectURL(blob);
    blobUrls.push(url);
    viewer.setAttribute('src', url);

    // 7. Verify: model-viewer has a blob: URL src
    const src = viewer.getAttribute('src');
    expect(src).toBeDefined();
    expect(src!.startsWith('blob:')).toBe(true);

    // Verify: blob is valid GLB (check glTF binary header)
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe('model/gltf-binary');

    const arrayBuffer = await blob.arrayBuffer();
    const dataView = new DataView(arrayBuffer);
    // GLB magic number: 0x46546C67 ("glTF" in ASCII, little-endian)
    const magic = dataView.getUint32(0, true);
    expect(magic).toBe(0x46546C67);
    // GLB version should be 2
    const version = dataView.getUint32(4, true);
    expect(version).toBe(2);
  });

  it('re-renders when parameters change', async () => {
    // 1. Import everything
    const { Manifold, manifoldToGLB } = await import('@manifold-studio/wrapper');
    const { Pane } = await import('tweakpane');
    await import('@google/model-viewer');

    // 2. Setup DOM
    tweakpaneContainer = document.createElement('div');
    viewerContainer = document.createElement('div');
    document.body.appendChild(tweakpaneContainer);
    document.body.appendChild(viewerContainer);

    function generateModel(params: { width: number; height: number; depth: number }) {
      return Manifold.cube([params.width, params.height, params.depth]);
    }

    // 3. Mount Tweakpane
    const params = { width: 10, height: 10, depth: 10 };
    pane = new Pane({ container: tweakpaneContainer });
    pane.addBinding(params, 'width', { min: 1, max: 100, step: 1 });
    pane.addBinding(params, 'height', { min: 1, max: 100, step: 1 });
    pane.addBinding(params, 'depth', { min: 1, max: 100, step: 1 });

    // 4. Create model-viewer
    viewer = document.createElement('model-viewer');
    viewer.setAttribute('style', 'width: 300px; height: 300px;');
    viewerContainer.appendChild(viewer);

    // 5. Initial render
    const model1 = generateModel(params);
    const blob1 = await manifoldToGLB(model1);
    const url1 = URL.createObjectURL(blob1);
    blobUrls.push(url1);
    viewer.setAttribute('src', url1);

    const firstSrc = viewer.getAttribute('src');
    expect(firstSrc).toBe(url1);

    // 6. Change params and re-render
    params.width = 20;
    pane.refresh();

    const model2 = generateModel(params);
    const blob2 = await manifoldToGLB(model2);
    const url2 = URL.createObjectURL(blob2);
    blobUrls.push(url2);
    viewer.setAttribute('src', url2);

    // 7. Verify: model-viewer.src changed to a NEW blob URL
    const secondSrc = viewer.getAttribute('src');
    expect(secondSrc).toBe(url2);
    expect(secondSrc).not.toBe(firstSrc);

    // 8. Revoke the old blob URL to prove cleanup works
    URL.revokeObjectURL(url1);
    // Remove from tracking since we already revoked it
    const idx = blobUrls.indexOf(url1);
    if (idx !== -1) blobUrls.splice(idx, 1);

    // The new src should still be intact
    expect(viewer.getAttribute('src')).toBe(url2);
  });

  it('handles rapid parameter changes without errors', async () => {
    // 1. Import everything
    const { Manifold, manifoldToGLB } = await import('@manifold-studio/wrapper');
    const { Pane } = await import('tweakpane');
    await import('@google/model-viewer');

    // 2. Setup DOM
    tweakpaneContainer = document.createElement('div');
    viewerContainer = document.createElement('div');
    document.body.appendChild(tweakpaneContainer);
    document.body.appendChild(viewerContainer);

    function generateModel(params: { width: number; height: number; depth: number }) {
      return Manifold.cube([params.width, params.height, params.depth]);
    }

    // 3. Mount Tweakpane
    const params = { width: 10, height: 10, depth: 10 };
    pane = new Pane({ container: tweakpaneContainer });
    pane.addBinding(params, 'width', { min: 1, max: 100, step: 1 });
    pane.addBinding(params, 'height', { min: 1, max: 100, step: 1 });
    pane.addBinding(params, 'depth', { min: 1, max: 100, step: 1 });

    // 4. Create model-viewer
    viewer = document.createElement('model-viewer');
    viewer.setAttribute('style', 'width: 300px; height: 300px;');
    viewerContainer.appendChild(viewer);

    // 5. Perform 5 rapid param changes + re-renders in a loop
    const widths = [15, 20, 25, 30, 35];
    for (const w of widths) {
      params.width = w;
      pane.refresh();

      const model = generateModel(params);
      const blob = await manifoldToGLB(model);
      const url = URL.createObjectURL(blob);
      blobUrls.push(url);
      viewer.setAttribute('src', url);
    }

    // 6. Verify no errors thrown and final model-viewer.src is valid
    const finalSrc = viewer.getAttribute('src');
    expect(finalSrc).toBeDefined();
    expect(finalSrc!.startsWith('blob:')).toBe(true);

    // The final blob URL should be the last one we created
    expect(finalSrc).toBe(blobUrls[blobUrls.length - 1]);

    // Verify we created 5 blob URLs total
    expect(blobUrls.length).toBe(5);
  });
});
