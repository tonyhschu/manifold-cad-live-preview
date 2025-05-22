// Simple service test to validate our architecture
import test from 'node:test';
import assert from 'node:assert/strict';

test('MockUrlService basic functionality', async (t) => {
  const { MockUrlService } = await import('../dist/services/services/UrlService.js');
  
  const service = new MockUrlService();
  
  await t.test('creates mock URLs', () => {
    const blob = new Blob(['test content']);
    const url = service.createObjectURL(blob);
    
    assert.ok(url.startsWith('blob:mock-'), 'Creates mock URL with correct prefix');
    assert.strictEqual(service.getManagedUrlCount(), 1, 'Tracks URL count correctly');
  });

  await t.test('generates filenames', () => {
    const filename = service.generateFilename('model', 'obj');
    
    assert.ok(filename.includes('model'), 'Contains base name');
    assert.ok(filename.endsWith('.obj'), 'Has correct extension');
  });

  await t.test('cleans up URLs', () => {
    const blob = new Blob(['test']);
    const url = service.createObjectURL(blob);
    
    service.cleanup();
    assert.strictEqual(service.getManagedUrlCount(), 0, 'All URLs cleaned up');
  });
});