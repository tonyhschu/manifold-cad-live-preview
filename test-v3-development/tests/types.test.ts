/**
 * V3 Types Test
 * 
 * Tests to prove that our extracted V3 types work correctly.
 * This validates Phase 1 completion.
 */

import { describe, it, expect } from 'vitest';
import type { 
  ModelMetadata, 
  ModelRegistryEntry, 
  ModelConfig,
  ModelPipeline,
  PipelineManifest 
} from '@manifold-studio/configurator/src/types';

describe('V3 Types', () => {
  describe('ModelMetadata', () => {
    it('should accept valid metadata', () => {
      const metadata: ModelMetadata = {
        name: 'Test Model',
        description: 'A test model for V3',
        author: 'Test Suite',
        version: '1.0.0'
      };

      expect(metadata.name).toBe('Test Model');
      expect(metadata.description).toBe('A test model for V3');
      expect(metadata.author).toBe('Test Suite');
      expect(metadata.version).toBe('1.0.0');
    });

    it('should work with minimal metadata', () => {
      const metadata: ModelMetadata = {
        name: 'Minimal Model',
        description: 'Just the basics'
      };

      expect(metadata.name).toBe('Minimal Model');
      expect(metadata.description).toBe('Just the basics');
      expect(metadata.author).toBeUndefined();
      expect(metadata.version).toBeUndefined();
    });
  });

  describe('ModelRegistryEntry', () => {
    it('should accept static model entry', () => {
      const entry: ModelRegistryEntry = {
        id: 'test-cube',
        path: './components/test-cube.ts',
        name: 'Test Cube',
        type: 'static'
      };

      expect(entry.type).toBe('static');
      expect(entry.loader).toBeUndefined();
    });

    it('should accept parametric model entry', () => {
      const entry: ModelRegistryEntry = {
        id: 'parametric-hook',
        path: './main.ts',
        name: 'Parametric Hook',
        type: 'parametric',
        loader: async () => ({ default: {} })
      };

      expect(entry.type).toBe('parametric');
      expect(entry.loader).toBeDefined();
      expect(typeof entry.loader).toBe('function');
    });
  });

  describe('ModelConfig', () => {
    it('should accept static model config', () => {
      const config: ModelConfig = {
        id: 'cube',
        name: 'Simple Cube',
        type: 'static'
      };

      expect(config.type).toBe('static');
      expect(config.config).toBeUndefined();
    });

    it('should accept parametric model config', () => {
      const config: ModelConfig = {
        id: 'hook',
        name: 'Parametric Hook',
        type: 'parametric',
        config: {
          name: 'Test Hook',
          parameters: {
            height: { type: 'number', value: 10, min: 1, max: 50 }
          },
          generateModel: () => ({})
        }
      };

      expect(config.type).toBe('parametric');
      expect(config.config).toBeDefined();
      expect(config.config?.parameters.height.value).toBe(10);
    });
  });

  describe('ModelPipeline', () => {
    it('should define correct interface', () => {
      // Create a mock pipeline that implements the interface
      const mockPipeline: ModelPipeline = {
        getAvailableModels: () => [
          { id: 'test', name: 'Test', type: 'static' }
        ],
        generateModel: (modelId: string, params?: any) => ({}),
        getModelConfig: (modelId: string) => null
      };

      expect(typeof mockPipeline.getAvailableModels).toBe('function');
      expect(typeof mockPipeline.generateModel).toBe('function');
      expect(typeof mockPipeline.getModelConfig).toBe('function');

      const models = mockPipeline.getAvailableModels();
      expect(models).toHaveLength(1);
      expect(models[0].id).toBe('test');
    });
  });

  describe('PipelineManifest', () => {
    it('should accept valid manifest', () => {
      const manifest: PipelineManifest = {
        models: [
          { id: 'main', name: 'Main Model', type: 'parametric' },
          { id: 'cube', name: 'Simple Cube', type: 'static' }
        ],
        lastCompiled: '2025-06-16T10:00:00.000Z',
        version: 1,
        compilation: {
          duration: 1500,
          errors: [],
          warnings: ['Unused parameter in model X']
        }
      };

      expect(manifest.models).toHaveLength(2);
      expect(manifest.version).toBe(1);
      expect(manifest.compilation.duration).toBe(1500);
      expect(manifest.compilation.warnings).toHaveLength(1);
    });
  });
});
