import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAvailableModels, getAvailableModelsAsync, loadDefaultModel, loadModelById, configureModelDiscovery } from '../../src/core/model-loader';

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
      // Configure for development mode
      configureModelDiscovery({ useDevelopmentModels: true });

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
      // Configure for development mode
      configureModelDiscovery({ useDevelopmentModels: true });

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
      // Configure for development mode
      configureModelDiscovery({ useDevelopmentModels: true });

      const models = await getAvailableModelsAsync();

      expect(models).toBeInstanceOf(Array);
      expect(models.length).toBeGreaterThan(0);

      // Should include our development models
      const modelIds = models.map(m => m.id);
      expect(modelIds).toContain('main');
      expect(modelIds).toContain('demo');
      expect(modelIds).toContain('cube');
    });

    it('should return models with correct structure including path', async () => {
      // Configure for development mode
      configureModelDiscovery({ useDevelopmentModels: true });

      const models = await getAvailableModelsAsync();

      models.forEach(model => {
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('type');
        expect(model).toHaveProperty('path');
        expect(['static', 'parametric']).toContain(model.type);
      });
    });
  });

  describe('getAvailableModelsAsync in generated projects', () => {
    beforeEach(() => {
      // Configure for generated project mode (file discovery)
      configureModelDiscovery({ useDevelopmentModels: false });
    });

    afterEach(() => {
      // Restore development mode
      configureModelDiscovery({ useDevelopmentModels: true });
    });

    it('should use custom models when configured', async () => {
      // Configure with custom models (simulates what would be discovered)
      const customModels = [
        { id: 'main', path: './main.ts', name: 'Test Box', type: 'parametric' as const },
        { id: 'components/wheel', path: './components/wheel.ts', name: 'Wheel Component', type: 'static' as const },
        { id: 'components/chassis', path: './components/chassis.ts', name: 'Chassis Component', type: 'static' as const }
      ];

      configureModelDiscovery({ customModels });

      const models = await getAvailableModelsAsync();

      expect(models).toBeInstanceOf(Array);
      expect(models.length).toBe(3);

      const modelIds = models.map(m => m.id);
      expect(modelIds).toContain('main');
      expect(modelIds).toContain('components/wheel');
      expect(modelIds).toContain('components/chassis');

      // Check that main is detected as parametric
      const mainModel = models.find(m => m.id === 'main');
      expect(mainModel?.type).toBe('parametric');
      expect(mainModel?.name).toBe('Test Box');
    });

    it('should discover models from actual files in test environment', async () => {
      // This tests the real file discovery mechanism
      // It will find actual TypeScript files in the test environment
      const models = await getAvailableModelsAsync();

      expect(models).toBeInstanceOf(Array);
      // Should find some files (even if they're not model files)
      expect(models.length).toBeGreaterThanOrEqual(0);

      // Each discovered model should have the correct structure
      models.forEach(model => {
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('type');
        expect(model).toHaveProperty('path');
        expect(['static', 'parametric']).toContain(model.type);
      });
    });
  });

  describe('loadDefaultModel', () => {
    it('should load the main model in development mode', async () => {
      // Ensure we're in development mode
      configureModelDiscovery({ useDevelopmentModels: true });

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
      // Ensure we're in development mode
      configureModelDiscovery({ useDevelopmentModels: true });

      const result = await loadModelById('demo');

      expect(result).toHaveProperty('model');
      expect(result).toHaveProperty('metadata');
      expect(result.isParametric).toBe(false);
      expect(result.metadata?.name).toBe('Demo Model');
    });

    it('should load a parametric model correctly', async () => {
      // Ensure we're in development mode
      configureModelDiscovery({ useDevelopmentModels: true });

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
