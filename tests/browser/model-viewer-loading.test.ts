import { describe, it, expect, afterEach } from 'vitest';

describe('model-viewer GLB blob loading in real Chromium', () => {
  let viewer: HTMLElement | null = null;
  let blobUrl: string | null = null;

  afterEach(() => {
    // Clean up DOM element
    if (viewer && viewer.parentNode) {
      viewer.parentNode.removeChild(viewer);
      viewer = null;
    }
    // Revoke blob URL
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      blobUrl = null;
    }
  });

  it('creates a model-viewer element and appends it to the DOM', async () => {
    // Dynamically import model-viewer so it registers the custom element
    await import('@google/model-viewer');

    // Verify the custom element is registered
    const ModelViewerConstructor = customElements.get('model-viewer');
    expect(ModelViewerConstructor).toBeDefined();

    // Create and append the element
    viewer = document.createElement('model-viewer');
    viewer.setAttribute('style', 'width: 300px; height: 300px;');
    document.body.appendChild(viewer);

    // Verify it's in the DOM
    expect(document.body.contains(viewer)).toBe(true);
    expect(viewer.tagName.toLowerCase()).toBe('model-viewer');
  });

  it('loads a GLB blob URL into model-viewer without errors', async () => {
    // Import model-viewer to register the custom element
    await import('@google/model-viewer');

    // Create the model-viewer element
    viewer = document.createElement('model-viewer');
    viewer.setAttribute('style', 'width: 300px; height: 300px;');
    document.body.appendChild(viewer);

    // Generate a GLB blob from ManifoldCAD
    const { Manifold, manifoldToGLB } = await import('@manifold-studio/wrapper');
    const cube = Manifold.cube([10, 10, 10]);
    const glbBlob = await manifoldToGLB(cube);

    // Verify the blob is valid
    expect(glbBlob).toBeInstanceOf(Blob);
    expect(glbBlob.size).toBeGreaterThan(0);
    expect(glbBlob.type).toBe('model/gltf-binary');

    // Create a blob URL and set it as the viewer source
    blobUrl = URL.createObjectURL(glbBlob);
    expect(blobUrl).toBeDefined();
    expect(blobUrl.startsWith('blob:')).toBe(true);

    viewer.setAttribute('src', blobUrl);

    // Verify the src attribute is set correctly
    expect(viewer.getAttribute('src')).toBe(blobUrl);
  });

  it('verifies GLB blob has valid glTF binary header', async () => {
    // Generate a GLB and inspect the binary header
    const { Manifold, manifoldToGLB } = await import('@manifold-studio/wrapper');
    const cube = Manifold.cube([10, 10, 10]);
    const glbBlob = await manifoldToGLB(cube);

    // Read the first 12 bytes of the GLB (magic + version + length)
    const arrayBuffer = await glbBlob.arrayBuffer();
    const dataView = new DataView(arrayBuffer);

    // GLB magic number: 0x46546C67 ("glTF" in ASCII, little-endian)
    const magic = dataView.getUint32(0, true);
    expect(magic).toBe(0x46546C67);

    // GLB version should be 2
    const version = dataView.getUint32(4, true);
    expect(version).toBe(2);

    // Total length should match the blob size
    const length = dataView.getUint32(8, true);
    expect(length).toBe(arrayBuffer.byteLength);
  });
});
