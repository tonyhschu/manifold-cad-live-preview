// tests/simple-schema.test.js
// Test just the core schema functionality

import { test } from 'node:test';
import assert from 'node:assert';

test('Parameter Schema Core Functionality', async (t) => {
  await t.test('can extract default values from schema', async () => {
    const { getDefaultValues } = await import('../dist/types/parameters.js');
    
    const schema = {
      thickness: {
        type: 'number',
        label: 'Thickness',
        default: 3,
        min: 1,
        max: 10,
        unit: 'mm'
      },
      mountingType: {
        type: 'enum',
        label: 'Mounting Type',
        default: 'screw',
        options: [
          { value: 'screw', label: 'Screw Mount' },
          { value: 'adhesive', label: 'Adhesive Mount' }
        ]
      },
      enabled: {
        type: 'boolean',
        label: 'Enabled',
        default: true
      },
      name: {
        type: 'string',
        label: 'Name',
        default: 'My Hook',
        maxLength: 50
      }
    };
    
    const defaults = getDefaultValues(schema);
    
    assert.strictEqual(defaults.thickness, 3, 'Should extract number default');
    assert.strictEqual(defaults.mountingType, 'screw', 'Should extract enum default');
    assert.strictEqual(defaults.enabled, true, 'Should extract boolean default');
    assert.strictEqual(defaults.name, 'My Hook', 'Should extract string default');
    
    console.log('✅ Default values extracted correctly:', defaults);
  });
  
  await t.test('can validate parameter values comprehensively', async () => {
    const { validateParameters } = await import('../dist/types/parameters.js');
    
    const schema = {
      size: {
        type: 'number',
        label: 'Size',
        default: 10,
        min: 1,
        max: 100,
        required: true
      },
      count: {
        type: 'integer',
        label: 'Count',
        default: 5,
        min: 1,
        max: 20
      },
      name: {
        type: 'string',
        label: 'Name',
        default: 'test',
        maxLength: 20
      },
      color: {
        type: 'enum',
        label: 'Color',
        default: 'red',
        options: [
          { value: 'red', label: 'Red' },
          { value: 'blue', label: 'Blue' },
          { value: 'green', label: 'Green' }
        ]
      },
      enabled: {
        type: 'boolean',
        label: 'Enabled',
        default: true
      }
    };
    
    // Test valid values
    const validResult = validateParameters({
      size: 50,
      count: 8,
      name: 'valid name',
      color: 'blue',
      enabled: false
    }, schema);
    
    assert.strictEqual(validResult.valid, true, 'Valid values should pass validation');
    assert.strictEqual(validResult.errors.length, 0, 'Should have no errors for valid input');
    
    // Test invalid values
    const invalidResult = validateParameters({
      size: 150,  // Above max
      count: 5.5, // Not integer
      name: 'this name is way too long to be valid',  // Too long
      color: 'purple',  // Not in enum
      enabled: 'yes'  // Wrong type
    }, schema);
    
    assert.strictEqual(invalidResult.valid, false, 'Invalid values should fail validation');
    assert.ok(invalidResult.errors.length >= 4, 'Should have multiple errors');
    
    // Test missing required value
    const missingResult = validateParameters({ name: 'test' }, schema);
    assert.strictEqual(missingResult.valid, false, 'Missing required value should fail');
    assert.ok(missingResult.errors.some(e => e.parameter === 'size'), 'Should have error for missing required size');
    
    console.log('✅ Parameter validation working correctly');
    console.log('   Valid result:', validResult.valid);
    console.log('   Invalid errors:', invalidResult.errors.length);
    console.log('   Sample error:', invalidResult.errors[0]);
  });
});