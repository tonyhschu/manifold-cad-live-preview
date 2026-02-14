import type { ManifoldType } from '@manifold-studio/wrapper';

export interface BarChartParams {
  csv: string;
  heightScale: number;
  barSpacing: number;
  barWidth: number;
  showLabels: boolean;
}

/**
 * Creates a 3D bar chart from CSV data.
 *
 * Each row of the CSV should have "label,value" format. A header row is
 * automatically skipped when the value column is not a number.
 *
 * Bars sit on the XY plane with base at y=0, growing upward along Y.
 * They are spaced along the X axis.
 *
 * @param params - Chart configuration including CSV data and styling
 * @param Manifold - The ManifoldCAD API (passed in to keep this module pure)
 * @returns A single Manifold geometry combining all bars
 */
export function barChart(
  params: BarChartParams,
  Manifold: ManifoldType
) {
  const { csv, heightScale, barSpacing, barWidth } = params;

  const rows = csv
    .trim()
    .split('\n')
    .map((line) => {
      const parts = line.split(',');
      const label = parts[0].trim();
      const value = parseFloat(parts[1]);
      return { label, value };
    })
    .filter((row) => !isNaN(row.value));

  if (rows.length === 0) {
    // Return a tiny degenerate cube so we always return valid geometry
    return Manifold.cube([0.001, 0.001, 0.001]);
  }

  const bars = rows.map((row, i) => {
    const height = row.value * heightScale;
    return Manifold.cube([barWidth, height, barWidth]).translate([
      i * (barWidth + barSpacing),
      0,
      0,
    ]);
  });

  if (bars.length === 1) {
    return bars[0];
  }

  return Manifold.union(bars);
}
