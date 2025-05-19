// src/lib/primitives.ts
import { withManifold } from './manifold-context';

// Function-based approach
export async function createCube(size: number[]) {
  console.log('Creating cube with function-based approach');
  return withManifold(Manifold => {
    return Manifold.cube(size);
  });
}

export async function createSphere(radius: number, resolution = 20) {
  console.log('Creating sphere with function-based approach');
  return withManifold(Manifold => {
    return Manifold.sphere(radius, resolution);
  });
}

export async function createCylinder(radius: number, height: number, sides = 32) {
  console.log('Creating cylinder with function-based approach');
  return withManifold(Manifold => {
    return Manifold.cylinder(radius, height, sides);
  });
}

// Class-based factory approach
export class PrimitiveFactory {
  constructor(private Manifold: any) {
    console.log('PrimitiveFactory created with pre-initialized Manifold class');
  }
  
  cube(size: number[]) {
    console.log('Creating cube with factory approach');
    return this.Manifold.cube(size);
  }
  
  sphere(radius: number, resolution = 20) {
    console.log('Creating sphere with factory approach');
    return this.Manifold.sphere(radius, resolution);
  }
  
  cylinder(radius: number, height: number, sides = 32) {
    console.log('Creating cylinder with factory approach');
    return this.Manifold.cylinder(radius, height, sides);
  }
}

// Factory creator function
export async function createPrimitiveFactory() {
  console.log('Creating primitive factory');
  return withManifold(Manifold => new PrimitiveFactory(Manifold));
}
