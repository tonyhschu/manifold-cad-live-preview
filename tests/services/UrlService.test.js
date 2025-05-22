// tests/services/UrlService.test.js
// Service layer tests with mocks - shows clean separation

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const servicesFile = path.join(__dirname, '../../dist/services/services/UrlService.js');

const skipTests = !fs.existsSync(servicesFile);

test('UrlService', async (t) => {
  if (skipTests) {
    return t.skip('Compiled services not found - run npm run compile');
  }

  const { UrlService, MockUrlService, createUrlService } = await import('../../dist/services/services/UrlService.js');

  await t.test('MockUrlService works in Node.js environment', async () => {
    const service = new MockUrlService();
    
    await t.test('creates mock URLs', () => {
      const blob = new Blob(['test']);
      const url = service.createObjectURL(blob);
      
      assert.ok(url.startsWith('blob:mock-'), 'Creates mock URL');
      assert.strictEqual(service.getManagedUrlCount(), 1, 'Tracks URLs');
    });

    await t.test('revokes URLs', () => {
      const blob = new Blob(['test']);
      const url = service.createObjectURL(blob);
      
      service.revokeObjectURL(url);
      assert.strictEqual(service.getManagedUrlCount(), 0, 'URL revoked');
    });

    await t.test('generates filenames', () => {
      const filename = service.generateFilename('model', 'obj');
      
      assert.ok(filename.includes('model'), 'Contains base name');
      assert.ok(filename.endsWith('.obj'), 'Has correct extension');
      assert.ok(filename.includes('mock'), 'Mock implementation marker');
    });

    await t.test('cleans up all URLs', () => {
      const blob1 = new Blob(['test1']);
      const blob2 = new Blob(['test2']);
      
      service.createObjectURL(blob1);
      service.createObjectURL(blob2);
      
      assert.strictEqual(service.getManagedUrlCount(), 2, 'Has 2 URLs');
      
      service.cleanup();
      assert.strictEqual(service.getManagedUrlCount(), 0, 'All URLs cleaned up');
    });
  });

  await t.test('createUrlService factory function', async () => {
    // In Node.js environment, should return MockUrlService
    const service = createUrlService();
    
    assert.ok(service, 'Creates service instance');
    assert.strictEqual(typeof service.createObjectURL, 'function', 'Has createObjectURL method');
    assert.strictEqual(typeof service.generateFilename, 'function', 'Has generateFilename method');
    assert.strictEqual(typeof service.cleanup, 'function', 'Has cleanup method');
  });

  await t.test('filename generation with various inputs', async () => {
    const service = new MockUrlService();
    
    await t.test('handles extension with dot', () => {
      const filename = service.generateFilename('test', '.obj');
      assert.ok(filename.endsWith('.obj'), 'Handles extension with dot');
    });

    await t.test('handles extension without dot', () => {
      const filename = service.generateFilename('test', 'obj');
      assert.ok(filename.endsWith('.obj'), 'Adds dot to extension');
    });

    await t.test('removes existing extension from basename', () => {
      const filename = service.generateFilename('model.old', 'obj');
      assert.ok(!filename.includes('.old'), 'Removes old extension');
      assert.ok(filename.endsWith('.obj'), 'Adds new extension');
    });
  });
});