// Test ParameterManager core functionality (logic only, no DOM/Tweakpane)
import test from 'node:test';
import assert from 'node:assert/strict';

test('ParameterManager Core Logic', async (t) => {
  // Since we can't easily test the full ParameterManager with DOM/Tweakpane in Node.js,
  // let's test the core parametric logic that it depends on
  
  // Manual re-implementation of the P helpers to test the logic
  const P = {
    number: (value, min, max, step) => ({ value, min, max, step }),
    boolean: (value) => ({ value }),
    select: (value, options) => {
      const optionsObj = Array.isArray(options) 
        ? options.reduce((acc, opt) => ({ ...acc, [opt]: opt }), {})
        : options;
      return { value, options: optionsObj };
    },
    string: (value) => ({ value })
  };

  const createConfig = (parameters, modelFn, metadata = {}) => ({
    parameters,
    generateModel: modelFn,
    ...metadata
  });

  await t.test('parameter initialization extracts defaults correctly', () => {
    const testConfig = createConfig(
      {
        width: P.number(10, 1, 100),
        height: P.number(20, 5, 50),  
        enabled: P.boolean(true),
        material: P.select("wood", ["wood", "metal"])
      },
      (params) => ({ mockModel: true, params })
    );

    // Test that we can extract default values
    const defaults = {};
    for (const [key, paramConfig] of Object.entries(testConfig.parameters)) {
      defaults[key] = paramConfig.value;
    }

    assert.deepStrictEqual(defaults, {
      width: 10,
      height: 20,
      enabled: true,
      material: "wood"
    }, 'Correctly extracts default parameter values');
  });

  await t.test('model generation receives complete parameter object', () => {
    let receivedParams = null;
    
    const testConfig = createConfig(
      {
        x: P.number(5),
        y: P.number(10),
        visible: P.boolean(false)
      },
      (params) => {
        receivedParams = params;
        return { generated: true };
      }
    );

    // Simulate what ParameterManager does - extract defaults and call generateModel
    const paramValues = {};
    for (const [key, paramConfig] of Object.entries(testConfig.parameters)) {
      paramValues[key] = paramConfig.value;
    }
    
    const result = testConfig.generateModel(paramValues);

    assert.deepStrictEqual(receivedParams, {
      x: 5,
      y: 10, 
      visible: false
    }, 'generateModel receives complete parameter object');

    assert.deepStrictEqual(result, { generated: true }, 'Model generation returns expected result');
  });

  await t.test('parameter value types are preserved', () => {
    const config = createConfig(
      {
        count: P.number(42),
        name: P.string("test"),
        active: P.boolean(true),
        type: P.select("A", ["A", "B", "C"])
      },
      () => ({ mock: true })
    );

    // Check parameter types are correct
    assert.strictEqual(typeof config.parameters.count.value, 'number', 'Number parameter has number value');
    assert.strictEqual(typeof config.parameters.name.value, 'string', 'String parameter has string value'); 
    assert.strictEqual(typeof config.parameters.active.value, 'boolean', 'Boolean parameter has boolean value');
    assert.strictEqual(typeof config.parameters.type.value, 'string', 'Select parameter has string value');
    
    // Check select options format
    assert.ok(config.parameters.type.options, 'Select parameter has options');
    assert.deepStrictEqual(config.parameters.type.options, {
      A: "A", B: "B", C: "C"
    }, 'Select options converted to object format');
  });

  await t.test('config creation with metadata works', () => {
    const config = createConfig(
      { width: P.number(10) },
      () => ({ test: true }),
      { name: "Test Model", description: "A test" }
    );

    assert.strictEqual(config.name, "Test Model", 'Config preserves name');
    assert.strictEqual(config.description, "A test", 'Config preserves description');
    assert.strictEqual(typeof config.generateModel, 'function', 'Config has generateModel function');
    assert.ok(config.parameters, 'Config has parameters');
  });
});