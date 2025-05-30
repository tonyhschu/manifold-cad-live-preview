// tests/lib/export.test.ts
// Pure library tests - can run in Node.js without browser dependencies

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Manifold } from '../../src/lib/manifold'
import { exportToOBJ, manifoldToOBJ } from '../../src/lib/export'
import { MockBlob, setupMockBlob } from '../test-utils'

// Setup mock Blob for Node.js environment
setupMockBlob()

describe('OBJ Export Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('manifoldToOBJ (pure function)', () => {
    it('converts manifold to OBJ string format', () => {
      // Create a simple cube model
      const cube = Manifold.cube([10, 10, 10])

      // Export to OBJ string
      const objString = manifoldToOBJ(cube)

      // Verify OBJ format
      expect(objString).toContain('# Exported from Manifold')
      expect(objString).toContain('v ') // Contains vertices
      expect(objString).toContain('f ') // Contains faces

      // Count vertices and faces
      const vertices = (objString.match(/^v /gm) || []).length
      const faces = (objString.match(/^f /gm) || []).length

      expect(vertices).toBeGreaterThanOrEqual(8) // Cube has at least 8 vertices
      expect(faces).toBeGreaterThanOrEqual(12) // Cube has at least 12 faces
    })

    it('includes metadata in OBJ output', () => {
      const cube = Manifold.cube([5, 5, 5])
      const objString = manifoldToOBJ(cube)

      // Check for metadata (note: format is "# Vertices: 8, Triangles: 12")
      expect(objString).toContain('# Vertices:')
      expect(objString).toContain('Triangles:')
      expect(objString).toContain('# Generated:')
    })

    it('handles different cube sizes correctly', () => {
      const smallCube = Manifold.cube([2, 2, 2])
      const largeCube = Manifold.cube([20, 20, 20])

      const smallOBJ = manifoldToOBJ(smallCube)
      const largeOBJ = manifoldToOBJ(largeCube)

      // Both should be valid OBJ format
      expect(smallOBJ).toContain('v ')
      expect(smallOBJ).toContain('f ')
      expect(largeOBJ).toContain('v ')
      expect(largeOBJ).toContain('f ')

      // Should have same topology (same number of vertices/faces for cubes)
      const smallVertices = (smallOBJ.match(/^v /gm) || []).length
      const largeVertices = (largeOBJ.match(/^v /gm) || []).length
      expect(smallVertices).toBe(largeVertices)
    })

    it('throws error for invalid mesh data', () => {
      // Create a mock manifold with invalid mesh
      const invalidManifold = {
        getMesh: () => ({
          vertProperties: null,
          triVerts: null
        })
      } as any

      expect(() => {
        manifoldToOBJ(invalidManifold)
      }).toThrow('Invalid mesh data for export')
    })
  })

  describe('exportToOBJ (browser wrapper)', () => {
    it('creates valid blob from manifold', () => {
      // Create a simple cube model
      const cube = Manifold.cube([10, 10, 10])

      // Export to OBJ blob
      const blob = exportToOBJ(cube)

      // Verify it's a blob
      expect(blob).toBeInstanceOf(MockBlob)
      expect(blob.type).toBe('model/obj')
      expect(blob.size).toBeGreaterThan(0)
    })

    it('blob contains valid OBJ geometry data', async () => {
      const cube = Manifold.cube([5, 5, 5])
      const blob = exportToOBJ(cube)

      // Read blob content
      const text = await blob.text()

      // Verify OBJ format
      expect(text).toContain('# Exported from Manifold')
      expect(text).toContain('v ') // Contains vertices
      expect(text).toContain('f ') // Contains faces

      // Count vertices and faces
      const vertices = (text.match(/^v /gm) || []).length
      const faces = (text.match(/^f /gm) || []).length

      expect(vertices).toBeGreaterThanOrEqual(8)
      expect(faces).toBeGreaterThanOrEqual(12)
    })

    it('handles export options parameter', () => {
      const cube = Manifold.cube([10, 10, 10])

      // Should not throw with options parameter
      expect(() => {
        exportToOBJ(cube, { filename: 'test.obj' })
      }).not.toThrow()
    })

    it('propagates errors from core function', () => {
      const invalidManifold = {
        getMesh: () => ({
          vertProperties: null,
          triVerts: null
        })
      } as any

      expect(() => {
        exportToOBJ(invalidManifold)
      }).toThrow('Invalid mesh data for export')
    })
  })

  describe('complex geometry export', () => {
    it('exports sphere geometry correctly', () => {
      const sphere = Manifold.sphere(5)
      const objString = manifoldToOBJ(sphere)

      expect(objString).toContain('v ')
      expect(objString).toContain('f ')

      // Sphere should have more vertices than a cube
      const vertices = (objString.match(/^v /gm) || []).length
      expect(vertices).toBeGreaterThan(8)
    })

    it('exports union operations correctly', () => {
      const cube1 = Manifold.cube([5, 5, 5])
      const cube2 = Manifold.cube([3, 3, 3])
      // Use static method for boolean operations with arrays (like in integration test)
      const unionResult = Manifold.union([cube1, cube2])

      const objString = manifoldToOBJ(unionResult)

      expect(objString).toContain('v ')
      expect(objString).toContain('f ')
      expect(objString).toContain('# Exported from Manifold')
    })
  })
});
