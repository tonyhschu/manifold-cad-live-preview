// src/models/demo.ts
// Demo model using the Manifold API

import { Vec2, Manifold } from "@manifold-studio/wrapper";

const range = (start: number, end: number) => {
  const length = end - start;
  return Array.from({ length }, (_, i) => start + i);
};

/**
 * Creates and returns a 3D model using ManifoldCAD operations
 */
export default function createModel(
  thickness = 3,
  width = 13,
  hookRadius = 10,
  segments = 16,
  hookEndAngle = Math.PI * 0.7
) {
  const hook: Vec2[] = range(0, segments + 1)
    .map((index) => {
      return (index / segments) * hookEndAngle;
    })
    .map((theta) => {
      return [
        Math.cos(theta) * hookRadius - hookRadius,
        Math.sin(theta) * hookRadius,
      ];
    });

  const anchorRadius = thickness / 2 + 3.1 / 2;
  const anchor: Vec2[] = range(0, segments + 1)
    .map((index) => {
      return (index / segments) * Math.PI;
    })
    .map((theta) => {
      return [
        Math.cos(theta) * anchorRadius + anchorRadius,
        -Math.sin(theta) * anchorRadius - 80,
      ];
    });

  const hookEndPoint = hook[hook.length - 1];
  const hookExtensionAngle = hookEndAngle + Math.PI / 2;
  const hookExtensionLength = 15;

  const midline: Vec2[] = ([] as Vec2[]).concat(
    [[2 * anchorRadius, -60]],
    anchor,
    [[0, -80]],
    hook,
    [
      // [-HOOK_RADIUS * 2, -10]
      [
        hookEndPoint[0] + (Math.cos(hookExtensionAngle) * width) / 2,
        hookEndPoint[1] + (Math.sin(hookExtensionAngle) * width) / 2,
      ],
    ]
  );

  const disks = midline.map((p) => {
    return Manifold.cylinder(width, thickness / 2, thickness / 2).translate([
      p[0],
      p[1],
      0,
    ]);
  });

  const hulls = range(0, midline.length - 1).map((index) => {
    const d0 = disks[index];
    const d1 = disks[index + 1];

    return Manifold.hull([d0, d1]);
  });

  const roundedEnd = Manifold.cylinder(thickness, width / 2, width / 2)
    // .translate([-THICKNESS / 2, 0, -THICKNESS / 2])
    .rotate([0, 90, 0]);

  const extension = Manifold.hull([
    roundedEnd.translate([0, 0, 0]),
    roundedEnd.translate([0, hookExtensionLength, 0]),
  ]);

  const result = Manifold.union([
    Manifold.union(hulls),
    extension
      .translate([-thickness / 2, width / 2, width / 2])
      .rotate([0, 0, ((hookExtensionAngle - Math.PI / 2) / Math.PI) * 180])
      .translate([hookEndPoint[0], hookEndPoint[1], 0]),
  ]);

  return result;
}

// Model metadata
export const modelMetadata = {
  name: "Demo Model",
  description:
    "A cube joined with a cylinder, with a sphere subtracted from it",
  author: "ManifoldCAD Team",
  version: "1.0.0",
};
