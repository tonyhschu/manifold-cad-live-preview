/**
 * Simple test model for integration testing
 * This is a minimal model that exercises all critical code paths
 */

import { Manifold } from 'manifold-3d';

export interface Parameters {
  size: number;
  height: number;
}

export const parameters: Parameters = {
  size: 10,
  height: 5
};

export default function main({ size, height }: Parameters): Manifold {
  // Create a simple cube for testing
  const cube = Manifold.cube([size, size, height]);
  return cube;
}

export const metadata = {
  name: 'Test Cube',
  description: 'A simple cube for integration testing',
  tags: ['test', 'basic', 'cube']
};
