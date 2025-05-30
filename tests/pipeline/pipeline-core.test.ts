// tests/pipeline/pipeline-core.test.ts
// Unit tests for pipeline core utilities

import { describe, it, expect, vi } from 'vitest';
import { P, createConfig } from '../../src/types/parametric-config';
import type { ParametricConfig } from '../../src/types/parametric-config';
import {
  isParametricConfig,
  extractDefaultParams,
  mergeParameters,
  parseParameterString,
  parseParameterValue,
  validateRequiredParameters,
  getParameterInfo
} from '../../src/pipeline/core.ts';

describe('Pipeline Core Utilities', () => {
  // Test data setup
  const mockParametricConfig: ParametricConfig = createConfig(
    {
      thickness: P.number(3, 1, 10, 0.5),
      width: P.number(13, 5, 50, 1),
      enabled: P.boolean(true),
      material: P.select("wood", ["wood", "metal", "plastic"]),
      name: P.string("test")
    },
    (params) => ({ mockModel: true, params }),
    { name: "Test Model", description: "A test model" }
  );

  const mockFunctionModel = (size = 10) => ({ cube: true, size });

  describe('isParametricConfig', () => {
    it('correctly identifies ParametricConfig objects', () => {
      expect(isParametricConfig(mockParametricConfig)).toBe(true);
    });

    it('rejects function exports', () => {
      expect(isParametricConfig(mockFunctionModel)).toBe(false);
    });

    it('rejects null and undefined', () => {
      expect(isParametricConfig(null)).toBe(false);
      expect(isParametricConfig(undefined)).toBe(false);
    });

    it('rejects objects without required properties', () => {
      expect(isParametricConfig({})).toBe(false);
      expect(isParametricConfig({ parameters: {} })).toBe(false);
      expect(isParametricConfig({ generateModel: () => {} })).toBe(false);
      expect(isParametricConfig({
        parameters: {},
        generateModel: "not a function"
      })).toBe(false);
    });

    it('accepts objects with required properties', () => {
      const validConfig = {
        parameters: { size: P.number(10) },
        generateModel: () => ({ test: true })
      };
      expect(isParametricConfig(validConfig)).toBe(true);
    });
  });

  describe('extractDefaultParams', () => {
    it('extracts default values from ParametricConfig', () => {
      const defaults = extractDefaultParams(mockParametricConfig);

      expect(defaults).toEqual({
        thickness: 3,
        width: 13,
        enabled: true,
        material: "wood",
        name: "test"
      });
    });

    it('handles empty parameters', () => {
      const emptyConfig = createConfig({}, () => ({ empty: true }));
      const defaults = extractDefaultParams(emptyConfig);

      expect(defaults).toEqual({});
    });

    it('preserves parameter types', () => {
      const defaults = extractDefaultParams(mockParametricConfig);

      expect(typeof defaults.thickness).toBe('number');
      expect(typeof defaults.width).toBe('number');
      expect(typeof defaults.enabled).toBe('boolean');
      expect(typeof defaults.material).toBe('string');
      expect(typeof defaults.name).toBe('string');
    });
  });

  describe('mergeParameters', () => {
    const defaults = { a: 1, b: true, c: "test" };

    it('merges user parameters with defaults', () => {
      const userParams = { a: 5, c: "updated" };
      const result = mergeParameters(defaults, userParams);

      expect(result).toEqual({
        a: 5,
        b: true,
        c: "updated"
      });
    });

    it('preserves defaults when no user params provided', () => {
      const result = mergeParameters(defaults, {});

      expect(result).toEqual(defaults);
      expect(result).not.toBe(defaults); // Should be a copy
    });

    it('ignores unknown parameters by default', () => {
      const userParams = { a: 5, unknown: "ignored" };
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = mergeParameters(defaults, userParams);

      expect(result).toEqual({ a: 5, b: true, c: "test" });
      expect(consoleSpy).toHaveBeenCalledWith('  Warning: Unknown parameter "unknown" ignored');

      consoleSpy.mockRestore();
    });

    it('calls onUnknownParam callback when provided', () => {
      const userParams = { a: 5, unknown: "ignored" };
      const onUnknownParam = vi.fn();

      const result = mergeParameters(defaults, userParams, { onUnknownParam });

      expect(result).toEqual({ a: 5, b: true, c: "test" });
      expect(onUnknownParam).toHaveBeenCalledWith("unknown");
    });

    it('logs changes when logChanges option is true', () => {
      const userParams = { a: 5, c: "updated" };
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mergeParameters(defaults, userParams, { logChanges: true });

      expect(consoleSpy).toHaveBeenCalledWith('  a: 1 → 5');
      expect(consoleSpy).toHaveBeenCalledWith('  c: test → updated');

      consoleSpy.mockRestore();
    });
  });

  describe('parseParameterString', () => {
    it('parses simple key=value pairs', () => {
      const result = parseParameterString("a=1,b=true,c=hello");

      expect(result).toEqual({
        a: 1,
        b: true,
        c: "hello"
      });
    });

    it('handles empty string', () => {
      expect(parseParameterString("")).toEqual({});
      expect(parseParameterString("   ")).toEqual({});
    });

    it('handles whitespace around parameters', () => {
      const result = parseParameterString(" a = 1 , b = true , c = hello ");

      expect(result).toEqual({
        a: 1,
        b: true,
        c: "hello"
      });
    });

    it('throws error for invalid format', () => {
      expect(() => parseParameterString("invalid")).toThrow('Invalid parameter format');
      expect(() => parseParameterString("a=1,invalid,b=2")).toThrow('Invalid parameter format');
    });

    it('throws error for empty keys', () => {
      expect(() => parseParameterString("=value")).toThrow('Empty parameter key');
      expect(() => parseParameterString("a=1, =value")).toThrow('Empty parameter key');
    });

    it('handles complex values', () => {
      const result = parseParameterString("name=my-model,count=42,active=false");

      expect(result).toEqual({
        name: "my-model",
        count: 42,
        active: false
      });
    });
  });

  describe('parseParameterValue', () => {
    it('parses boolean values', () => {
      expect(parseParameterValue("true")).toBe(true);
      expect(parseParameterValue("false")).toBe(false);
    });

    it('parses numeric values', () => {
      expect(parseParameterValue("42")).toBe(42);
      expect(parseParameterValue("3.14")).toBe(3.14);
      expect(parseParameterValue("-10")).toBe(-10);
      expect(parseParameterValue("0")).toBe(0);
    });

    it('keeps string values as strings', () => {
      expect(parseParameterValue("hello")).toBe("hello");
      expect(parseParameterValue("test-value")).toBe("test-value");
      expect(parseParameterValue("")).toBe("");
    });

    it('handles edge cases', () => {
      expect(parseParameterValue("NaN")).toBe("NaN");
      expect(parseParameterValue("Infinity")).toBe(Infinity);
      expect(parseParameterValue("-Infinity")).toBe(-Infinity);
    });
  });

  describe('validateRequiredParameters', () => {
    it('passes when all required parameters are present', () => {
      const params = { a: 1, b: 2, c: 3 };
      const required = ['a', 'b'];

      expect(() => validateRequiredParameters(params, required)).not.toThrow();
    });

    it('throws when required parameters are missing', () => {
      const params = { a: 1 };
      const required = ['a', 'b', 'c'];

      expect(() => validateRequiredParameters(params, required))
        .toThrow('Missing required parameters: b, c');
    });

    it('handles empty requirements', () => {
      const params = { a: 1 };
      const required: string[] = [];

      expect(() => validateRequiredParameters(params, required)).not.toThrow();
    });
  });

  describe('getParameterInfo', () => {
    it('extracts parameter information correctly', () => {
      const info = getParameterInfo(mockParametricConfig);

      expect(info.names).toEqual(['thickness', 'width', 'enabled', 'material', 'name']);
      expect(info.defaults).toEqual({
        thickness: 3,
        width: 13,
        enabled: true,
        material: "wood",
        name: "test"
      });
      expect(info.types).toEqual({
        thickness: 'number',
        width: 'number',
        enabled: 'boolean',
        material: 'select',
        name: 'string'
      });
    });

    it('handles empty config', () => {
      const emptyConfig = createConfig({}, () => ({ empty: true }));
      const info = getParameterInfo(emptyConfig);

      expect(info.names).toEqual([]);
      expect(info.defaults).toEqual({});
      expect(info.types).toEqual({});
    });
  });
});
