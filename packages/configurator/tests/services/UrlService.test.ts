// tests/services/UrlService.test.ts
// Service layer tests with mocks - shows clean separation

import { describe, it, expect, beforeEach } from 'vitest'
import { UrlService, MockUrlService, createUrlService } from '../../src/services/UrlService'
import { MockBlob, setupMockBlob } from '../test-utils'

// Setup mock Blob for Node.js environment
setupMockBlob()

describe('UrlService', () => {
  describe('MockUrlService works in Node.js environment', () => {
    let service: MockUrlService

    beforeEach(() => {
      service = new MockUrlService()
    })

    it('creates mock URLs', () => {
      const blob = new MockBlob(['test'])
      const url = service.createObjectURL(blob)

      expect(url).toMatch(/^blob:mock-\d+$/)
      expect(service.getManagedUrlCount()).toBe(1)
    })

    it('revokes URLs', () => {
      const blob = new MockBlob(['test'])
      const url = service.createObjectURL(blob)

      service.revokeObjectURL(url)
      expect(service.getManagedUrlCount()).toBe(0)
    })

    it('generates filenames', () => {
      const filename = service.generateFilename('model', 'obj')

      expect(filename).toContain('model')
      expect(filename).toMatch(/\.obj$/)
      expect(filename).toContain('mock')
    })

    it('cleans up all URLs', () => {
      const blob1 = new MockBlob(['test1'])
      const blob2 = new MockBlob(['test2'])

      service.createObjectURL(blob1)
      service.createObjectURL(blob2)

      expect(service.getManagedUrlCount()).toBe(2)

      service.cleanup()
      expect(service.getManagedUrlCount()).toBe(0)
    })

    it('tracks URLs correctly with multiple operations', () => {
      const blobs = [
        new MockBlob(['content1']),
        new MockBlob(['content2']),
        new MockBlob(['content3'])
      ]

      const urls = blobs.map(blob => service.createObjectURL(blob))
      expect(service.getManagedUrlCount()).toBe(3)

      // Revoke one URL
      service.revokeObjectURL(urls[1])
      expect(service.getManagedUrlCount()).toBe(2)

      // Create another URL
      service.createObjectURL(new MockBlob(['content4']))
      expect(service.getManagedUrlCount()).toBe(3)

      // Cleanup all
      service.cleanup()
      expect(service.getManagedUrlCount()).toBe(0)
    })
  })

  describe('createUrlService factory function', () => {
    it('creates service instance in Node.js environment', () => {
      // In Node.js environment, should return MockUrlService
      const service = createUrlService()

      expect(service).toBeDefined()
      expect(typeof service.createObjectURL).toBe('function')
      expect(typeof service.generateFilename).toBe('function')
      expect(typeof service.cleanup).toBe('function')
    })

    it('factory returns working service', () => {
      const service = createUrlService()
      // Use real Blob in happy-dom environment instead of MockBlob
      const blob = new Blob(['test'], { type: 'text/plain' })

      const url = service.createObjectURL(blob)
      // In happy-dom, real URLs are created, not mock URLs
      expect(url).toMatch(/^blob:/)

      expect(service.getManagedUrlCount()).toBe(1)

      service.cleanup()
      expect(service.getManagedUrlCount()).toBe(0)
    })
  })

  describe('filename generation with various inputs', () => {
    let service: MockUrlService

    beforeEach(() => {
      service = new MockUrlService()
    })

    it('handles extension with dot', () => {
      const filename = service.generateFilename('test', '.obj')
      expect(filename).toMatch(/\.obj$/)
    })

    it('handles extension without dot', () => {
      const filename = service.generateFilename('test', 'obj')
      expect(filename).toMatch(/\.obj$/)
    })

    it('removes existing extension from basename', () => {
      const filename = service.generateFilename('model.old', 'obj')
      expect(filename).not.toContain('.old')
      expect(filename).toMatch(/\.obj$/)
    })

    it('handles empty basename', () => {
      const filename = service.generateFilename('', 'obj')
      expect(filename).toMatch(/^_mock\.obj$/)
    })

    it('handles multiple dots in basename', () => {
      const filename = service.generateFilename('my.model.v2.old', 'obj')
      expect(filename).toContain('my.model.v2')
      expect(filename).not.toContain('.old')
      expect(filename).toMatch(/\.obj$/)
    })

    it('preserves basename when no extension present', () => {
      const filename = service.generateFilename('mymodel', 'obj')
      expect(filename).toContain('mymodel')
      expect(filename).toMatch(/\.obj$/)
    })
  })

  describe('UrlService (browser implementation)', () => {
    // Note: We can't fully test the real UrlService in Node.js since it depends on browser APIs
    // But we can test that it exists and has the right interface

    it('has correct interface', () => {
      expect(UrlService).toBeDefined()
      expect(typeof UrlService).toBe('function')

      // Check that it has the expected methods (without instantiating)
      const proto = UrlService.prototype
      expect(typeof proto.createObjectURL).toBe('function')
      expect(typeof proto.revokeObjectURL).toBe('function')
      expect(typeof proto.generateFilename).toBe('function')
      expect(typeof proto.cleanup).toBe('function')
      expect(typeof proto.getManagedUrlCount).toBe('function')
    })
  })
});
