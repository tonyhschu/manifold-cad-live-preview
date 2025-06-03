import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAvailableModels, getAvailableModelsAsync, loadDefaultModel, loadModelById } from '../../src/core/model-loader';

// Mock import.meta.env
vi.mock('import.meta', () => ({
  env: {
    DEV: true
  }
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/packages/configurator/'
  },
  writable: true
});

describe('Model Loader', () => {
  beforeEach(() => {
    // Reset any mocks
    vi.clearAllMocks();
  });

  describe('getAvailableModels (sync)', () => {
    it('should return development models in development mode', () => {
      const models = getAvailableModels();

      expect(models).toBeInstanceOf(Array);
      expect(models.length).toBeGreaterThan(0);

      // Should include our development models
      const modelIds = models.map(m => m.id);
      expect(modelIds).toContain('main');
      expect(modelIds).toContain('demo');
      expect(modelIds).toContain('cube');
    });

    it('should return models with correct structure', () => {
      const models = getAvailableModels();

      models.forEach(model => {
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('type');
        expect(['static', 'parametric']).toContain(model.type);
      });
    });
  });

  describe('getAvailableModelsAsync', () => {
    it('should return development models in development mode', async () => {
      const models = await getAvailableModelsAsync();

      expect(models).toBeInstanceOf(Array);
      expect(models.length).toBeGreaterThan(0);

      // Should include our development models
      const modelIds = models.map(m => m.id);
      expect(modelIds).toContain('main');
      expect(modelIds).toContain('demo');
      expect(modelIds).toContain('cube');
    });
  });

  describe('loadDefaultModel', () => {
    it('should load the main model in development mode', async () => {
      const result = await loadDefaultModel();

      expect(result).toHaveProperty('model');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('isParametric');

      // In development mode, should load main model (parametric hook)
      expect(result.metadata?.name).toBe('Parametric Hook');
      expect(result.isParametric).toBe(true);
    });
  });

  describe('loadModelById', () => {
    it('should load a static model correctly', async () => {
      const result = await loadModelById('demo');

      expect(result).toHaveProperty('model');
      expect(result).toHaveProperty('metadata');
      expect(result.isParametric).toBe(false);
      expect(result.metadata?.name).toBe('Demo Model');
    });

    it('should load a parametric model correctly', async () => {
      const result = await loadModelById('main');

      expect(result).toHaveProperty('model');
      expect(result).toHaveProperty('config');
      expect(result.isParametric).toBe(true);
      expect(result.config).toHaveProperty('parameters');
      expect(result.config).toHaveProperty('generateModel');
    });

    it('should throw error for non-existent model', async () => {
      await expect(loadModelById('non-existent')).rejects.toThrow('Model with ID "non-existent" not found');
    });
  });
});
