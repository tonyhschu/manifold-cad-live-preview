// tests/lib/export.test.js
// Pure library tests - can run in Node.js without browser dependencies

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distFile = path.join(__dirname, '../../dist/lib/export.js');
const manifoldFile = path.join(__dirname, '../../dist/lib/manifold.js');

// Skip tests if compiled files don't exist
const skipTests = !fs.existsSync(distFile) || !fs.existsSync(manifoldFile);

test('OBJ Export Functions', async (t) => {
  if (skipTests) {
    return t.skip('Compiled files not found - run npm run compile');
  }

  // Import the compiled modules
  const exportModule = await import('../../dist/lib/export.js');
  const manifoldModule = await import('../../dist/lib/manifold.js');

  await t.test('exportToOBJ creates valid blob', async () => {
    // Create a simple cube model
    const cube = manifoldModule.Manifold.cube([10, 10, 10]);
    
    // Export to OBJ
    const blob = exportModule.exportToOBJ(cube);
    
    // Verify it's a blob
    assert.ok(blob instanceof Blob, 'Returns a Blob object');
    assert.strictEqual(blob.type, 'model/obj', 'Has correct MIME type');
    assert.ok(blob.size > 0, 'Blob has content');
  });

  await t.test('exported OBJ contains valid geometry data', async () => {
    const cube = manifoldModule.Manifold.cube([5, 5, 5]);
    const blob = exportModule.exportToOBJ(cube);
    
    // Read blob content
    const text = await blob.text();
    
    // Verify OBJ format
    assert.ok(text.includes('# Exported from Manifold'), 'Contains header comment');
    assert.ok(text.includes('v '), 'Contains vertices (v lines)');
    assert.ok(text.includes('f '), 'Contains faces (f lines)');
    
    // Count vertices and faces
    const vertices = (text.match(/^v /gm) || []).length;
    const faces = (text.match(/^f /gm) || []).length;
    
    assert.ok(vertices >= 8, 'Cube has at least 8 vertices');
    assert.ok(faces >= 12, 'Cube has at least 12 faces');
  });

  await t.test('handles empty/invalid models gracefully', async () => {
    // Test with invalid input
    assert.throws(() => {
      exportModule.exportToOBJ(null);
    }, 'Throws error for null input');
    
    assert.throws(() => {
      exportModule.exportToOBJ({});
    }, 'Throws error for invalid model object');
  });
});

