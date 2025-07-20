// src/models/tracked-test.ts
// Simple test model to verify operation tracking

import { Manifold } from "@manifold-studio/wrapper";
import type { OperationInfo } from "@manifold-studio/wrapper";

export default function createTrackedTest() {


  // Create base with metadata
  const base = Manifold.cube([10, 10, 2], {
    name: "Base Plate"
  });

  // Create hole
  const hole = Manifold.cylinder(2, 2, 3, undefined, {
    name: "Mounting Hole"
  });

  // Combine operations
  const translated = base.translate([0, 0, 1]);
  const result = Manifold.difference([translated, hole]);

  // Operation tree available via result.getOperationTree()

  return result;
}
