import { describe, it, expect } from 'vitest';
import { barChart, type BarChartParams } from '../../src/lib/bar-chart';

const SAMPLE_CSV = `label,value
Alpha,30
Beta,50
Gamma,20
Delta,45
Epsilon,35`;

const defaultParams: BarChartParams = {
  csv: SAMPLE_CSV,
  heightScale: 1,
  barSpacing: 2,
  barWidth: 10,
  showLabels: false,
};

describe('barChart model', () => {
  it('generates valid geometry from CSV data', async () => {
    const { Manifold } = await import('@manifold-studio/wrapper');

    const result = barChart(defaultParams, Manifold);
    const mesh = result.getMesh();

    expect(mesh.vertProperties.length).toBeGreaterThan(0);
    expect(mesh.triVerts.length).toBeGreaterThan(0);
  });

  it('creates correct bounding box width for 5 bars', async () => {
    const { Manifold } = await import('@manifold-studio/wrapper');

    const result = barChart(defaultParams, Manifold);
    const bbox = result.boundingBox();

    // 5 bars: total X span = 5 * barWidth + 4 * barSpacing = 5*10 + 4*2 = 58
    const expectedWidth =
      5 * defaultParams.barWidth + 4 * defaultParams.barSpacing;
    expect(bbox.min[0]).toBeCloseTo(0, 1);
    expect(bbox.max[0]).toBeCloseTo(expectedWidth, 1);
  });

  it('respects heightScale parameter', async () => {
    const { Manifold } = await import('@manifold-studio/wrapper');

    const result1x = barChart({ ...defaultParams, heightScale: 1 }, Manifold);
    const result2x = barChart({ ...defaultParams, heightScale: 2 }, Manifold);

    const bbox1 = result1x.boundingBox();
    const bbox2 = result2x.boundingBox();

    // The tallest bar value is 50, so at scale 1 max Y should be ~50,
    // at scale 2 max Y should be ~100
    expect(bbox2.max[1]).toBeCloseTo(bbox1.max[1] * 2, 1);
  });

  it('exports to valid GLB', async () => {
    const { Manifold, manifoldToGLB } = await import(
      '@manifold-studio/wrapper'
    );

    const result = barChart(defaultParams, Manifold);
    const blob = await manifoldToGLB(result);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe('model/gltf-binary');
  });

  it('handles single row CSV', async () => {
    const { Manifold } = await import('@manifold-studio/wrapper');

    const singleRowCsv = `label,value
Only,42`;

    const result = barChart(
      { ...defaultParams, csv: singleRowCsv },
      Manifold
    );
    const mesh = result.getMesh();

    expect(mesh.vertProperties.length).toBeGreaterThan(0);
    expect(mesh.triVerts.length).toBeGreaterThan(0);

    const bbox = result.boundingBox();
    // Single bar: width should equal barWidth
    expect(bbox.max[0]).toBeCloseTo(defaultParams.barWidth, 1);
    // Height should be value * heightScale = 42
    expect(bbox.max[1]).toBeCloseTo(42, 1);
  });
});
