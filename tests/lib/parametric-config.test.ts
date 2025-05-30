// Test the parametric configuration system
import { describe, it, expect } from 'vitest'
import { P, createConfig } from '../../src/types/parametric-config'

describe('Parametric Configuration System', () => {
  it('P.number creates correct parameter config', () => {
    const param = P.number(10, 1, 100, 0.5);
    
    expect(param.value).toBe(10);
    expect(param.min).toBe(1);
    expect(param.max).toBe(100);
    expect(param.step).toBe(0.5);
  });

  it('P.boolean creates correct parameter config', () => {
    const param = P.boolean(true);
    
    expect(param.value).toBe(true);
    expect(typeof param.value).toBe('boolean');
  });

  it('P.select creates correct dropdown config', () => {
    const param = P.select("option1", ["option1", "option2", "option3"]);
    
    expect(param.value).toBe("option1");
    expect(param.options).toEqual({
      option1: "option1",
      option2: "option2", 
      option3: "option3"
    });
  });

  it('P.select handles object options', () => {
    const options = { small: "10", medium: "20", large: "30" };
    const param = P.select("20", options);
    
    expect(param.value).toBe("20");
    expect(param.options).toEqual(options);
  });

  it('P.string creates correct string config', () => {
    const param = P.string("default text");
    
    expect(param.value).toBe("default text");
  });

  it('P.color creates correct color config', () => {
    const param = P.color("#ff0000");
    
    expect(param.value).toBe("#ff0000");
    expect(param.color).toEqual({ type: 'float' });
  });

  it('createConfig creates valid ParametricConfig', () => {
    const mockGenerateModel = (params: any) => ({ 
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

    expect(config.name).toBe("Test Model");
    expect(config.description).toBe("A test model");
    expect(typeof config.generateModel).toBe('function');
    
    // Test parameter structure
    expect(config.parameters.width.value).toBe(10);
    expect(config.parameters.height.value).toBe(20);
    expect(config.parameters.visible.value).toBe(true);
    expect(config.parameters.material.value).toBe("wood");

    // Test model generation
    const result = config.generateModel({
      width: 15,
      height: 25,
      visible: false,
      material: "metal"
    });

    expect(result.mockManifold).toBe(true);
    expect(result.params).toEqual({
      width: 15,
      height: 25,
      visible: false,
      material: "metal"
    });
  });

  it('parameter defaults extraction', () => {
    const config = createConfig(
      {
        thickness: P.number(3, 1, 10),
        enabled: P.boolean(false),
        type: P.select("A", ["A", "B", "C"])
      },
      () => ({ mockModel: true })
    );

    // Extract default values from config
    const defaults: Record<string, any> = {};
    for (const [key, paramConfig] of Object.entries(config.parameters)) {
      defaults[key] = paramConfig.value;
    }

    expect(defaults).toEqual({
      thickness: 3,
      enabled: false,
      type: "A"
    });
  });
});
