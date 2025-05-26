// Test the parametric configuration system
import test from 'node:test';
import assert from 'node:assert/strict';

test('Parametric Configuration System', async (t) => {
  const { P, createConfig } = await import('../dist/types/parametric-config.js');
  
  await t.test('P.number creates correct parameter config', () => {
    const param = P.number(10, 1, 100, 0.5);
    
    assert.strictEqual(param.value, 10, 'Sets default value');
    assert.strictEqual(param.min, 1, 'Sets minimum value');
    assert.strictEqual(param.max, 100, 'Sets maximum value');
    assert.strictEqual(param.step, 0.5, 'Sets step value');
  });

  await t.test('P.boolean creates correct parameter config', () => {
    const param = P.boolean(true);
    
    assert.strictEqual(param.value, true, 'Sets boolean value');
    assert.strictEqual(typeof param.value, 'boolean', 'Value is boolean type');
  });

  await t.test('P.select creates correct dropdown config', () => {
    const param = P.select("option1", ["option1", "option2", "option3"]);
    
    assert.strictEqual(param.value, "option1", 'Sets default selection');
    assert.deepStrictEqual(param.options, {
      option1: "option1",
      option2: "option2", 
      option3: "option3"
    }, 'Converts array to object format for Tweakpane');
  });

  await t.test('P.select handles object options', () => {
    const options = { small: "10", medium: "20", large: "30" };
    const param = P.select("20", options);
    
    assert.strictEqual(param.value, "20", 'Sets default selection');
    assert.deepStrictEqual(param.options, options, 'Preserves object format');
  });

  await t.test('P.string creates correct string config', () => {
    const param = P.string("default text");
    
    assert.strictEqual(param.value, "default text", 'Sets string value');
  });

  await t.test('P.color creates correct color config', () => {
    const param = P.color("#ff0000");
    
    assert.strictEqual(param.value, "#ff0000", 'Sets color value');
    assert.deepStrictEqual(param.color, { type: 'float' }, 'Sets color type');
  });

  await t.test('createConfig creates valid ParametricConfig', () => {
    const mockGenerateModel = (params) => ({ 
      mockManifold: true, 
      params 
    });

    const config = createConfig(
      {
        width: P.number(10, 1, 100),
        height: P.number(20, 5, 50),
        visible: P.boolean(true),
        material: P.select("wood", ["wood", "metal", "plastic"])
      },
      mockGenerateModel,
      { name: "Test Model", description: "A test model" }
    );

    assert.strictEqual(config.name, "Test Model", 'Sets model name');
    assert.strictEqual(config.description, "A test model", 'Sets model description');
    assert.strictEqual(typeof config.generateModel, 'function', 'Has generateModel function');
    
    // Test parameter structure
    assert.strictEqual(config.parameters.width.value, 10, 'Width parameter correct');
    assert.strictEqual(config.parameters.height.value, 20, 'Height parameter correct');
    assert.strictEqual(config.parameters.visible.value, true, 'Boolean parameter correct');
    assert.strictEqual(config.parameters.material.value, "wood", 'Select parameter correct');

    // Test model generation
    const result = config.generateModel({
      width: 15,
      height: 25,
      visible: false,
      material: "metal"
    });

    assert.strictEqual(result.mockManifold, true, 'Model generation works');
    assert.deepStrictEqual(result.params, {
      width: 15,
      height: 25,
      visible: false,
      material: "metal"
    }, 'Parameters passed correctly to model function');
  });

  await t.test('parameter defaults extraction', () => {
    const config = createConfig(
      {
        thickness: P.number(3, 1, 10),
        enabled: P.boolean(false),
        type: P.select("A", ["A", "B", "C"])
      },
      () => ({ mockModel: true })
    );

    // Extract default values from config
    const defaults = {};
    for (const [key, paramConfig] of Object.entries(config.parameters)) {
      defaults[key] = paramConfig.value;
    }

    assert.deepStrictEqual(defaults, {
      thickness: 3,
      enabled: false,
      type: "A"
    }, 'Can extract default values from parameter config');
  });
});