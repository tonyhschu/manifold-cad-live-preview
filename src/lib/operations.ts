// src/lib/operations.ts
import { withManifold, ManifoldType } from './manifold-context';

// Function-based approach
export async function union(shapes: any[]) {
  console.log('Performing union operation with function-based approach');
  return withManifold(manifold => {
    let result = shapes[0];
    for (let i = 1; i < shapes.length; i++) {
      result = manifold.union(result, shapes[i]);
    }
    return result;
  });
}

export async function difference(a: any, b: any) {
  console.log('Performing difference operation with function-based approach');
  return withManifold(manifold => {
    return manifold.difference(a, b);
  });
}

export async function intersection(a: any, b: any) {
  console.log('Performing intersection operation with function-based approach');
  return withManifold(manifold => {
    return manifold.intersection(a, b);
  });
}

// Class-based factory approach
export class OperationsFactory {
  constructor(private manifold: ManifoldType) {
    console.log('OperationsFactory created with pre-initialized Manifold instance');
  }
  
  union(shapes: any[]) {
    console.log('Performing union operation with factory approach');
    let result = shapes[0];
    for (let i = 1; i < shapes.length; i++) {
      result = this.manifold.union(result, shapes[i]);
    }
    return result;
  }
  
  difference(a: any, b: any) {
    console.log('Performing difference operation with factory approach');
    return this.manifold.difference(a, b);
  }
  
  intersection(a: any, b: any) {
    console.log('Performing intersection operation with factory approach');
    return this.manifold.intersection(a, b);
  }
}

// Factory creator function
export async function createOperationsFactory() {
  console.log('Creating operations factory');
  return withManifold(manifold => new OperationsFactory(manifold));
}
