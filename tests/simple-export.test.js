// Simple export service test
import test from 'node:test';
import assert from 'node:assert/strict';

test('ExportService format management', async (t) => {
  const { ExportService } = await import('../dist/services/services/ExportService.js');
  const { MockUrlService } = await import('../dist/services/services/UrlService.js');
  
  const mockUrlService = new MockUrlService();
  const exportService = new ExportService(mockUrlService);
  
  await t.test('getSupportedFormats returns formats', () => {
    const formats = exportService.getSupportedFormats();
    
    assert.ok(Array.isArray(formats), 'Returns array of formats');
    assert.ok(formats.length >= 2, 'Has at least 2 formats');
    
    const objFormat = formats.find(f => f.id === 'obj');
    assert.ok(objFormat, 'Includes OBJ format');
    assert.strictEqual(objFormat.name, 'Wavefront OBJ', 'OBJ has correct name');
  });

  await t.test('isFormatSupported works', () => {
    assert.ok(exportService.isFormatSupported('obj'), 'Supports OBJ');
    assert.ok(exportService.isFormatSupported('glb'), 'Supports GLB');
    assert.ok(!exportService.isFormatSupported('xyz'), 'Does not support unknown format');
  });

  await t.test('getFormat returns correct format', () => {
    const objFormat = exportService.getFormat('obj');
    assert.ok(objFormat, 'Returns OBJ format object');
    assert.strictEqual(objFormat.id, 'obj', 'Format has correct ID');
    
    const invalid = exportService.getFormat('invalid');
    assert.strictEqual(invalid, undefined, 'Returns undefined for invalid format');
  });
});