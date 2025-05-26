// tests/parameter-reflection.test.js
// Test the parameter reflection API

import { test } from 'node:test';
import assert from 'node:assert';

test('Parameter Reflection API', async (t) => {
  await t.test('can discover parameters from a parametric model', async () => {
    // Mock the parametric hook model
    const { param, withParameters } = await import('../dist/core/core/parameter-reflection.js');
    
    // Create a simple test model with parameters
    const testParameters = {
      schema: {
        size: param.number({
          label: "Size",
          default: 10,
          min: 1,
          max: 100
        }),
        color: param.enum({
          label: "Color",
          default: "red",
          options: [
            { value: "red", label: "Red" },
            { value: "blue", label: "Blue" }
          ]
        }),
        enabled: param.boolean({
          label: "Enabled",
          default: true
        })
      }
    };
    
    function testModel(params = {}) {
      const { size = 10, color = "red", enabled = true } = params;
      return { size, color, enabled };
    }
    
    const parametricModel = withParameters(testModel, testParameters);
    
    // Test that parameters are attached
    assert.ok(parametricModel.parameters, 'Parameters should be attached to function');
    assert.strictEqual(Object.keys(parametricModel.parameters.schema).length, 3, 'Should have 3 parameters');
    assert.strictEqual(parametricModel.parameters.schema.size.type, 'number', 'Size should be number type');
    assert.strictEqual(parametricModel.parameters.schema.color.type, 'enum', 'Color should be enum type');
    assert.strictEqual(parametricModel.parameters.schema.enabled.type, 'boolean', 'Enabled should be boolean type');
  });
  
  await t.test('can extract default values from schema', async () => {
    const { getDefaultValues } = await import('../dist/types/parameters.js');
    
    const schema = {
      thickness: {
        type: 'number',
        label: 'Thickness',
        default: 3
      },
      mountingType: {
        type: 'enum',
        label: 'Mounting',
        default: 'screw',
        options: [
          { value: 'screw', label: 'Screw' },
          { value: 'adhesive', label: 'Adhesive' }
        ]
      },
      enabled: {
        type: 'boolean',
        label: 'Enabled',
        default: true
      }
    };
    
    const defaults = getDefaultValues(schema);
    
    assert.strictEqual(defaults.thickness, 3, 'Should extract number default');
    assert.strictEqual(defaults.mountingType, 'screw', 'Should extract enum default');
    assert.strictEqual(defaults.enabled, true, 'Should extract boolean default');
  });
  
  await t.test('can validate parameter values', async () => {
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
      name: {
        type: 'string',
        label: 'Name',
        default: 'test',
        maxLength: 20
      }
    };
    
    // Valid values
    const validResult = validateParameters({ size: 50, name: 'valid' }, schema);
    assert.strictEqual(validResult.valid, true, 'Valid values should pass');
    assert.strictEqual(validResult.errors.length, 0, 'Should have no errors');
    
    // Invalid values
    const invalidResult = validateParameters({ size: 150, name: 'this name is way too long to be valid' }, schema);
    assert.strictEqual(invalidResult.valid, false, 'Invalid values should fail');
    assert.ok(invalidResult.errors.length > 0, 'Should have errors');
    
    // Missing required value
    const missingResult = validateParameters({ name: 'test' }, schema);
    assert.strictEqual(missingResult.valid, false, 'Missing required should fail');
    assert.ok(missingResult.errors.some(e => e.parameter === 'size'), 'Should have error for missing size');
  });
});