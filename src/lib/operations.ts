// src/lib/operations.ts
import { withManifold } from "./manifold-context";

// Function-based approach
export async function union(shapes: any[]) {
  console.log("Performing union operation with function-based approach");
  if (shapes.length === 0) return null;
  if (shapes.length === 1) return shapes[0];

  return withManifold(() => {
    let result = shapes[0];

    debugger;

    for (let i = 1; i < shapes.length; i++) {
      result = result.union(shapes[i]);
    }
    return result;
  });
}

export async function difference(a: any, b: any) {
  console.log("Performing difference operation with function-based approach");
  if (!a || !b) return a;

  return withManifold(() => {
    return a.difference(b);
  });
}

export async function intersection(a: any, b: any) {
  console.log("Performing intersection operation with function-based approach");
  if (!a || !b) return null;

  return withManifold(() => {
    return a.intersection(b);
  });
}

// Class-based factory approach
export class OperationsFactory {
  constructor() {
    console.log("OperationsFactory created");
  }

  union(shapes: any[]) {
    console.log("Performing union operation with factory approach");
    if (shapes.length === 0) return null;
    if (shapes.length === 1) return shapes[0];

    let result = shapes[0];
    for (let i = 1; i < shapes.length; i++) {
      result = result.union(shapes[i]);
    }
    return result;
  }

  difference(a: any, b: any) {
    console.log("Performing difference operation with factory approach");
    if (!a || !b) return a;
    return a.difference(b);
  }

  intersection(a: any, b: any) {
    console.log("Performing intersection operation with factory approach");
    if (!a || !b) return null;
    return a.intersection(b);
  }
}

// Factory creator function
export async function createOperationsFactory() {
  console.log("Creating operations factory");
  return new OperationsFactory();
}
