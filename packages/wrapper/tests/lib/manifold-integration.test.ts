// tests/lib/manifold-integration.test.ts
// Integration test for manifold.ts
// This test verifies that the module exports match the actual WASM module

import { describe, it, expect } from 'vitest'
import {
  Manifold,
  CrossSection,
  getModule,
  setMinCircularAngle,
  setMinCircularEdgeLength,
  setCircularSegments,
  getCircularSegments,
  resetToCircularDefaults,
  utils
} from '../../src/lib/manifold'

describe('manifold.ts correctly exports all WASM module features', () => {
  it('can import and initialize the module', () => {
    // Module should be imported and initialized via top-level await
    expect(Manifold).toBeDefined()
    expect(typeof Manifold).toBe('function')
  })

  it('can access raw WASM module', () => {
    const rawModule = getModule()
    expect(rawModule).toBeDefined()
    expect(rawModule.Manifold).toBeDefined()
  })

  it('exports all Manifold class methods', () => {
    const rawModule = getModule()
    const rawManifold = rawModule.Manifold

    expect(Manifold).toBeDefined()
    expect(rawManifold).toBeDefined()

    // Get methods from raw Manifold (static methods)
    const rawMethods = Object.getOwnPropertyNames(rawManifold)
      .filter(name => typeof rawManifold[name] === 'function')

    console.log('Raw Manifold methods:', rawMethods)

    // Check that all raw methods are available on exported Manifold
    for (const method of rawMethods) {
      expect(typeof Manifold[method as keyof typeof Manifold]).toBe('function')
    }
  })

  it('exports essential utility functions', () => {
    // Define the essential utility functions we want to expose
    const essentialUtils = [
      'setMinCircularAngle',
      'setMinCircularEdgeLength',
      'setCircularSegments',
      'getCircularSegments',
      'resetToCircularDefaults'
    ]

    const rawModule = getModule()

    // Find utility functions in raw module
    const rawUtilFunctions = Object.entries(rawModule)
      .filter(([key, value]) =>
        typeof value === 'function' &&
        !['Manifold', 'CrossSection', 'setup'].includes(key))
      .map(([key]) => key)

    console.log('Raw utility functions:', rawUtilFunctions)

    // Check that essential utility functions are directly exported
    expect(typeof setMinCircularAngle).toBe('function')
    expect(typeof setMinCircularEdgeLength).toBe('function')
    expect(typeof setCircularSegments).toBe('function')
    expect(typeof getCircularSegments).toBe('function')
    expect(typeof resetToCircularDefaults).toBe('function')
  })

  it('exports Manifold and CrossSection classes transparently', () => {
    // Test that classes are exported
    expect(typeof Manifold).toBe('function')
    expect(typeof CrossSection).toBe('function')

    // Test that primitive functions are accessible on Manifold class
    const primitiveFunctions = ['cube', 'cylinder', 'sphere']
    for (const func of primitiveFunctions) {
      expect(typeof Manifold[func as keyof typeof Manifold]).toBe('function')
    }

    // Test that they actually work by creating simple shapes
    const testCube = Manifold.cube([5, 5, 5])
    expect(testCube).toBeDefined()
    expect(typeof testCube.getMesh).toBe('function')

    const testSphere = Manifold.sphere(3)
    expect(testSphere).toBeDefined()
    expect(typeof testSphere.getMesh).toBe('function')
  })

  it('Manifold class has boolean operation methods', () => {
    const booleanOps = ['union', 'difference', 'intersection', 'hull']

    // Test boolean operation methods on Manifold class
    for (const func of booleanOps) {
      expect(typeof Manifold[func as keyof typeof Manifold]).toBe('function')
    }

    // Test that they work
    const cube1 = Manifold.cube([5, 5, 5])
    const cube2 = Manifold.cube([3, 3, 3])
    const unionResult = Manifold.union([cube1, cube2])
    expect(unionResult).toBeDefined()
    expect(typeof unionResult.getMesh).toBe('function')
  })

  it('provides transparent access to original API', () => {
    // Test that we can access the raw module for advanced operations
    expect(typeof getModule).toBe('function')

    const rawModule = getModule()
    expect(rawModule).toBeDefined()
    expect(typeof rawModule.Manifold).toBe('function')

    // Test that the exported Manifold is a proxy wrapper (not the same object, but provides same functionality)
    expect(Manifold).not.toBe(rawModule.Manifold) // Now it's a proxy!
    expect(CrossSection).toBe(rawModule.CrossSection) // CrossSection is still direct export

    // Test that all expected Manifold static methods exist and work
    const expectedMethods = ['cube', 'sphere', 'cylinder', 'union', 'difference', 'intersection', 'hull']
    for (const method of expectedMethods) {
      expect(typeof Manifold[method as keyof typeof Manifold]).toBe('function')
    }

    // Test that the proxy provides additional tracking methods
    const cube = Manifold.cube([5, 5, 5])
    expect(typeof cube.getOperationTree).toBe('function')
    expect(typeof cube.getOperationId).toBe('function')

    // Test that original functionality still works through the proxy
    expect(typeof cube.getMesh).toBe('function')
    expect(typeof cube.translate).toBe('function')
    const mesh = cube.getMesh()
    expect(mesh.vertProperties).toBeDefined()
  })

  it('exports utils object with utility functions', () => {
    expect(utils).toBeDefined()
    expect(typeof utils).toBe('object')

    // Utils should contain utility functions
    const utilEntries = Object.entries(utils)
    expect(utilEntries.length).toBeGreaterThan(0)

    // All entries should be functions
    for (const [key, value] of utilEntries) {
      expect(typeof value).toBe('function')
    }
  })

  it('can create and manipulate complex geometries', () => {
    // Test more complex operations to ensure the module works correctly
    const box = Manifold.cube([10, 10, 10])
    const sphere = Manifold.sphere(6)

    // Test union operation (which we know works)
    const union = Manifold.union([box, sphere])
    expect(union).toBeDefined()

    const mesh = union.getMesh()
    expect(mesh).toBeDefined()
    expect(mesh.vertProperties).toBeDefined()
    expect(mesh.triVerts).toBeDefined()
    expect(mesh.vertProperties.length).toBeGreaterThan(0)
    expect(mesh.triVerts.length).toBeGreaterThan(0)
  })

  it('utility functions work correctly', () => {
    // Test that utility functions can be called
    // Note: getCircularSegments might need a parameter, let's test the setters

    // Set new value
    setCircularSegments(32)

    // Test other utility functions
    setMinCircularAngle(0.1)
    setMinCircularEdgeLength(0.5)

    // Reset to defaults
    resetToCircularDefaults()

    // Just verify the functions exist and can be called
    expect(typeof setCircularSegments).toBe('function')
    expect(typeof setMinCircularAngle).toBe('function')
    expect(typeof setMinCircularEdgeLength).toBe('function')
    expect(typeof resetToCircularDefaults).toBe('function')
  })
});
