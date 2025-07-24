/**
 * V3 Utilities Test
 * 
 * Tests to prove that our extracted V3 utilities work correctly.
 * This validates the salvaged V1 code.
 */

import { describe, it, expect } from 'vitest';
import {
  isParametricConfig,
  extractDefaultParams,
  validateModelExport,
  getModelNameFromExport,
  extractModelName,
  modelIdToDisplayName,
  filePathToModelId,
  isModelFile
} from '@manifold-studio/configurator/src/utils/model-detection.js';
import {
  extractModelName as extractModelNamePath,
  modelIdToDisplayName as modelIdToDisplayNamePath,
  filePathToModelId as filePathToModelIdPath,
  isModelFile as isModelFilePath
} from '@manifold-studio/configurator/src/utils/path-utils.js';

describe('V3 Utilities', () => {
  describe('Model Detection', () => {
    describe('isParametricConfig', () => {
      it('should detect valid parametric config', () => {
        const config = {
          name: 'Test Model',
          parameters: {
            height: { type: 'number', value: 10, min: 1, max: 50 }
          },
          generateModel: (params: any) => ({})
        };

        expect(isParametricConfig(config)).toBe(true);
      });

      it('should reject invalid configs', () => {
        expect(isParametricConfig(null)).toBeFalsy();
        expect(isParametricConfig(undefined)).toBeFalsy();
        expect(isParametricConfig({})).toBeFalsy();
        expect(isParametricConfig({ parameters: {} })).toBeFalsy();
        expect(isParametricConfig({ generateModel: () => {} })).toBeFalsy();
        expect(isParametricConfig(() => {})).toBeFalsy();
      });
    });

    describe('extractDefaultParams', () => {
      it('should extract default parameter values', () => {
        const config = {
          name: 'Test Model',
          parameters: {
            height: { type: 'number', value: 10, min: 1, max: 50 },
            width: { type: 'number', value: 5, min: 1, max: 20 },
            enabled: { type: 'boolean', value: true }
          },
          generateModel: (params: any) => ({})
        };

        const defaults = extractDefaultParams(config);
        
        expect(defaults).toEqual({
          height: 10,
          width: 5,
          enabled: true
        });
      });
    });

    describe('validateModelExport', () => {
      it('should validate parametric model', () => {
        const config = {
          parameters: { height: { type: 'number', value: 10 } },
          generateModel: () => ({})
        };

        const result = validateModelExport(config);
        expect(result.isValid).toBe(true);
        expect(result.type).toBe('parametric');
        expect(result.error).toBeUndefined();
      });

      it('should validate static model', () => {
        const func = () => ({});

        const result = validateModelExport(func);
        expect(result.isValid).toBe(true);
        expect(result.type).toBe('static');
        expect(result.error).toBeUndefined();
      });

      it('should reject invalid exports', () => {
        const result1 = validateModelExport(null);
        expect(result1.isValid).toBe(false);
        expect(result1.type).toBe('invalid');
        expect(result1.error).toBe('No default export found');

        const result2 = validateModelExport({});
        expect(result2.isValid).toBe(false);
        expect(result2.type).toBe('invalid');
        expect(result2.error).toBe('Export must be either a function or ParametricConfig object');
      });
    });

    describe('getModelNameFromExport', () => {
      it('should get name from parametric config', () => {
        const config = {
          name: 'Custom Hook',
          parameters: {},
          generateModel: () => ({})
        };

        const name = getModelNameFromExport(config, 'fallback');
        expect(name).toBe('Custom Hook');
      });

      it('should use fallback for static models', () => {
        const func = () => ({});
        const name = getModelNameFromExport(func, 'Static Model');
        expect(name).toBe('Static Model');
      });
    });
  });

  describe('Path Utilities', () => {
    describe('extractModelName', () => {
      it('should handle main model', () => {
        expect(extractModelNamePath('./main.ts')).toBe('main');
        expect(extractModelNamePath('./main.js')).toBe('main');
      });

      it('should handle component models', () => {
        expect(extractModelNamePath('./components/wheel.ts')).toBe('components/wheel');
        expect(extractModelNamePath('./components/chassis.js')).toBe('components/chassis');
      });

      it('should handle nested paths', () => {
        expect(extractModelNamePath('./nested/dir/model.ts')).toBe('nested/dir/model');
      });
    });

    describe('modelIdToDisplayName', () => {
      it('should convert simple names', () => {
        expect(modelIdToDisplayNamePath('main')).toBe('Main');
        expect(modelIdToDisplayNamePath('wheel')).toBe('Wheel');
      });

      it('should handle kebab-case', () => {
        expect(modelIdToDisplayNamePath('chassis-copy')).toBe('Chassis Copy');
        expect(modelIdToDisplayNamePath('front-axle')).toBe('Front Axle');
      });

      it('should handle nested paths', () => {
        expect(modelIdToDisplayNamePath('components/wheel')).toBe('Components / Wheel');
        expect(modelIdToDisplayNamePath('components/chassis-copy')).toBe('Components / Chassis Copy');
      });
    });

    describe('filePathToModelId', () => {
      it('should normalize file paths', () => {
        expect(filePathToModelIdPath('components/chassis copy.ts')).toBe('components/chassis-copy');
        expect(filePathToModelIdPath('Components/Wheel.js')).toBe('components/wheel');
      });
    });

    describe('isModelFile', () => {
      it('should accept valid model files', () => {
        expect(isModelFilePath('main.ts')).toBe(true);
        expect(isModelFilePath('components/wheel.js')).toBe(true);
        expect(isModelFilePath('nested/model.ts')).toBe(true);
      });

      it('should reject invalid files', () => {
        expect(isModelFilePath('README.md')).toBe(false);
        expect(isModelFilePath('package.json')).toBe(false);
        expect(isModelFilePath('node_modules/something.ts')).toBe(false);
        expect(isModelFilePath('dist/output.js')).toBe(false);
      });
    });
  });
});
