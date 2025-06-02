// tests/lib/operation-tracking.test.ts
// Test operation tracking functionality

import { describe, it, expect, beforeEach } from 'vitest'
import { Manifold } from '../../src/lib/manifold'
import { getOperationRegistry } from '../../src/lib/tracking/operation-registry'

describe('Operation Tracking', () => {
  beforeEach(() => {
    // Clear the operation registry before each test
    getOperationRegistry().clear()
  })

  it('tracks primitive creation operations', () => {
    const cube = Manifold.cube([5, 5, 5])

    // Should have tracking methods
    expect(typeof cube.getOperationTree).toBe('function')
    expect(typeof cube.getOperationId).toBe('function')

    // Should have an operation tree with one entry
    const tree = cube.getOperationTree()
    expect(tree).toHaveLength(1)
    expect(tree[0].type).toBe('cube')
    expect(tree[0].inputIds).toEqual([])
    expect(tree[0].metadata.parameters).toEqual([[5, 5, 5]])
  })

  it('tracks multiple primitive operations', () => {
    const cube = Manifold.cube([10, 10, 10])
    const sphere = Manifold.sphere(5)
    const cylinder = Manifold.cylinder(8, 3, 3)

    // Each should have their own operation tree
    expect(cube.getOperationTree()).toHaveLength(1)
    expect(sphere.getOperationTree()).toHaveLength(1)
    expect(cylinder.getOperationTree()).toHaveLength(1)

    // Check operation types
    expect(cube.getOperationTree()[0].type).toBe('cube')
    expect(sphere.getOperationTree()[0].type).toBe('sphere')
    expect(cylinder.getOperationTree()[0].type).toBe('cylinder')
  })

  it('tracks transformation operations', () => {
    const cube = Manifold.cube([5, 5, 5])
    const translated = cube.translate([1, 2, 3])

    // Original cube should have 1 operation
    expect(cube.getOperationTree()).toHaveLength(1)

    // Translated cube should have 2 operations (cube + translate)
    const tree = translated.getOperationTree()
    expect(tree).toHaveLength(2)

    // Check the operations are in dependency order
    expect(tree[0].type).toBe('cube')
    expect(tree[1].type).toBe('translate')
    expect(tree[1].inputIds).toEqual([tree[0].id])
    expect(tree[1].metadata.parameters).toEqual([[1, 2, 3]])
  })

  it('tracks chained transformations', () => {
    const result = Manifold.cube([5, 5, 5])
      .translate([1, 0, 0])
      .rotate([0, 0, 45])
      .scale([2, 2, 2])

    const tree = result.getOperationTree()
    expect(tree).toHaveLength(4)

    // Check operation sequence
    expect(tree[0].type).toBe('cube')
    expect(tree[1].type).toBe('translate')
    expect(tree[2].type).toBe('rotate')
    expect(tree[3].type).toBe('scale')

    // Check dependencies
    expect(tree[1].inputIds).toEqual([tree[0].id])
    expect(tree[2].inputIds).toEqual([tree[1].id])
    expect(tree[3].inputIds).toEqual([tree[2].id])
  })

  it('tracks boolean operations', () => {
    const cube1 = Manifold.cube([10, 10, 10])
    const cube2 = Manifold.cube([5, 5, 5])
    const union = Manifold.union([cube1, cube2])

    const tree = union.getOperationTree()
    expect(tree).toHaveLength(3)

    // Check operations
    expect(tree[0].type).toBe('cube')
    expect(tree[1].type).toBe('cube')
    expect(tree[2].type).toBe('union')

    // Union should depend on both cubes
    expect(tree[2].inputIds).toEqual([tree[0].id, tree[1].id])
  })

  it('tracks complex operation chains', () => {
    // Create a more complex model: base with hole
    const base = Manifold.cube([20, 20, 5])
    const hole = Manifold.cylinder(10, 2, 2)
    const translatedBase = base.translate([0, 0, 2])
    const result = Manifold.difference([translatedBase, hole])

    const tree = result.getOperationTree()
    expect(tree).toHaveLength(4)

    // Check the full dependency chain (in dependency order)
    expect(tree[0].type).toBe('cube')      // base
    expect(tree[1].type).toBe('translate') // translated base
    expect(tree[2].type).toBe('cylinder')  // hole
    expect(tree[3].type).toBe('difference') // final result

    // Check dependencies
    expect(tree[1].inputIds).toEqual([tree[0].id]) // translate depends on cube
    expect(tree[3].inputIds).toEqual([tree[1].id, tree[2].id]) // difference depends on both
  })

  it('preserves original Manifold API completely', () => {
    // Test that all original functionality still works
    const cube = Manifold.cube([5, 5, 5])
    const sphere = Manifold.sphere(3)

    // Original methods should work
    expect(typeof cube.getMesh).toBe('function')
    const mesh = cube.getMesh()
    expect(mesh.vertProperties).toBeDefined()
    expect(mesh.triVerts).toBeDefined()

    // Boolean operations should work
    const union = Manifold.union([cube, sphere])
    expect(union.getMesh()).toBeDefined()

    // Transformations should work
    const translated = cube.translate([1, 0, 0])
    expect(translated.getMesh()).toBeDefined()
  })

  it('handles multiple boolean operations', () => {
    const cube1 = Manifold.cube([10, 10, 10])
    const cube2 = Manifold.cube([8, 8, 8])
    const cube3 = Manifold.cube([6, 6, 6])

    const union = Manifold.union([cube1, cube2, cube3])

    const tree = union.getOperationTree()
    expect(tree).toHaveLength(4) // 3 cubes + 1 union

    // Union should depend on all three cubes
    expect(tree[3].type).toBe('union')
    expect(tree[3].inputIds).toHaveLength(3)
    expect(tree[3].inputIds).toEqual([tree[0].id, tree[1].id, tree[2].id])
  })

  it('generates unique operation IDs', () => {
    const cube1 = Manifold.cube([5, 5, 5])
    const cube2 = Manifold.cube([5, 5, 5])

    const id1 = cube1.getOperationId()
    const id2 = cube2.getOperationId()

    expect(id1).not.toBe(id2)
    expect(typeof id1).toBe('string')
    expect(typeof id2).toBe('string')
  })

  it('includes timestamps in operation info', () => {
    const cube = Manifold.cube([5, 5, 5])
    const tree = cube.getOperationTree()

    expect(tree[0].timestamp).toBeDefined()
    expect(typeof tree[0].timestamp).toBe('number')
    expect(tree[0].timestamp).toBeGreaterThan(0)
  })
})
