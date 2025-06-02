// src/models/tracked-test.ts
// Simple test model to verify operation tracking

import { Manifold } from "@manifold-studio/wrapper";
import type { OperationInfo } from "@manifold-studio/wrapper";

export default function createTrackedTest() {
  console.log("Creating tracked test model...");

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

  // Log the operation tree
  console.log("Operation Tree:");
  const tree = result.getOperationTree();
  tree.forEach((op: OperationInfo, index: number) => {
    const indent = "  ".repeat(op.inputIds.length);
    const name = op.metadata.name || `${op.type}`;
    const params = op.metadata.parameters ?
      ` (${JSON.stringify(op.metadata.parameters)})` : '';
    console.log(`${indent}${index}: ${name}${params}`);
  });

  return result;
}
