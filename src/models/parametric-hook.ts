// src/models/parametric-hook.ts
// Parametric hook model using Tweakpane-based ParametricConfig

import { Vec2 } from "manifold-3d";
import { Manifold } from "../lib/manifold";
import { P, createConfig } from "../types/parametric-config";
import type { ParametricConfig } from "../types/parametric-config";

const range = (start: number, end: number) => {
  const length = end - start;
  return Array.from({ length }, (_, i) => start + i);
};

/**
 * Pure function for creating hook geometry
 */
function createHook(
  thickness = 3,
  width = 13, 
  hookRadius = 10,
  segments = 16,
  hookEndAngle = Math.PI * 0.7,
  mountingType = "screw",
  includeRounding = true
): Manifold {


  // Generate hook curve points
  const hook: Vec2[] = range(0, segments + 1)
    .map((index) => (index / segments) * hookEndAngle)
    .map((theta) => [
      Math.cos(theta) * hookRadius - hookRadius,
      Math.sin(theta) * hookRadius,
    ]);

  // Generate anchor points based on mounting type
  const anchorRadius = thickness / 2 + (mountingType === "adhesive" ? 2 : 3.1) / 2;
  const anchor: Vec2[] = range(0, segments + 1)
    .map((index) => (index / segments) * Math.PI)
    .map((theta) => [
      Math.cos(theta) * anchorRadius + anchorRadius,
      -Math.sin(theta) * anchorRadius - 80,
    ]);

  const hookEndPoint = hook[hook.length - 1];
  const hookExtensionAngle = hookEndAngle + Math.PI / 2;
  const hookExtensionLength = 15;

  // Build the midline path
  const midline: Vec2[] = ([] as Vec2[]).concat(
    [[2 * anchorRadius, -60]],
    anchor,
    [[0, -80]],
    hook,
    [
      [
        hookEndPoint[0] + (Math.cos(hookExtensionAngle) * width) / 2,
        hookEndPoint[1] + (Math.sin(hookExtensionAngle) * width) / 2,
      ],
    ]
  );

  // Create geometry along the midline
  const disks = midline.map((p) => {
    let disk = Manifold.cylinder(width, thickness / 2, thickness / 2).translate([
      p[0],
      p[1],
      0,
    ]);
    
    // Apply rounding if requested
    if (includeRounding) {
      // Could add actual rounding logic here
    }
    
    return disk;
  });

  const hulls = range(0, midline.length - 1).map((index) => {
    const d0 = disks[index];
    const d1 = disks[index + 1];
    return Manifold.hull([d0, d1]);
  });

  // Create the hook end based on mounting type
  let roundedEnd = Manifold.cylinder(thickness, width / 2, width / 2).rotate([0, 90, 0]);
  
  if (mountingType === "adhesive") {
    // Make the back flatter for adhesive mounting
    const flatBack = Manifold.cube([thickness, width, width], true);
    roundedEnd = Manifold.union([roundedEnd, flatBack]);
  }

  const extension = Manifold.hull([
    roundedEnd.translate([0, 0, 0]),
    roundedEnd.translate([0, hookExtensionLength, 0]),
  ]);

  let result = Manifold.union([
    Manifold.union(hulls),
    extension
      .translate([-thickness / 2, width / 2, width / 2])
      .rotate([0, 0, ((hookExtensionAngle - Math.PI / 2) / Math.PI) * 180])
      .translate([hookEndPoint[0], hookEndPoint[1], 0]),
  ]);

  // Add mounting features
  if (mountingType === "screw") {
    // Add screw hole
    const screwHole = Manifold.cylinder(2, thickness + 2, 8).translate([0, -40, 0]);
    result = Manifold.difference(result, screwHole);
  } else if (mountingType === "magnetic") {
    // Add magnet cavity
    const magnetCavity = Manifold.cylinder(8, 3, 8).translate([0, -40, -thickness/2 + 1]);
    result = Manifold.difference(result, magnetCavity);
  }

  return result;
}

// Parametric configuration using Tweakpane format
export const hookConfig: ParametricConfig = createConfig(
  {
    thickness: P.number(3, 1, 10, 0.5),
    width: P.number(13, 5, 50, 1),
    hookRadius: P.number(10, 5, 20, 0.5),
    segments: P.number(16, 8, 64, 1),
    hookEndAngle: P.number(Math.PI * 0.7, Math.PI * 0.3, Math.PI * 0.9, 0.1),
    mountingType: P.select("screw", ["screw", "adhesive", "magnetic"]),
    includeRounding: P.boolean(true)
  },
  (params) => createHook(
    params.thickness,
    params.width,
    params.hookRadius,
    params.segments,
    params.hookEndAngle,
    params.mountingType,
    params.includeRounding
  ),
  {
    name: "Parametric Hook",
    description: "A customizable wall hook with adjustable dimensions and mounting options"
  }
);

// Export pure function for composition
export { createHook };

// Default export for backward compatibility
export default hookConfig;