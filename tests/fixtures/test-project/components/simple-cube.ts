/**
 * Simple component for HMR testing
 * This component will be modified during HMR tests
 */

import { Manifold } from 'manifold-3d';

export interface SimpleCubeParams {
  width: number;
  depth: number;
  height: number;
}

export const parameters: SimpleCubeParams = {
  width: 5,
  depth: 5,
  height: 3
};

export default function simpleCube({ width, depth, height }: SimpleCubeParams): Manifold {
  // Create a simple rectangular cube
  const cube = Manifold.cube([width, depth, height]);
  return cube;
}

export const metadata = {
  name: 'Simple Cube Component',
  description: 'A basic cube component for testing HMR functionality',
  tags: ['component', 'test', 'hmr']
};
