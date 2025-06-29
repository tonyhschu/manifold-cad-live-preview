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

  afterEach(() => {
    // Reset model discovery configuration to prevent test pollution
    configureModelDiscovery({ useDevelopmentModels: false, customModels: undefined });
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
      // Configure with custom models using test fixtures
      const customModels = [
        { id: 'main', path: './tests/fixtures/main.ts', name: 'Test Box', type: 'parametric' as const },
        { id: 'components/wheel', path: './tests/fixtures/components/wheel.ts', name: 'Wheel Component', type: 'static' as const },
        { id: 'components/chassis', path: './tests/fixtures/components/chassis.ts', name: 'Chassis Component', type: 'static' as const }
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

    it('should throw error when main.ts is not found', async () => {
      // This tests the new philosophy: main.ts is required
      // In test environment, there's no main.ts in configurator root, so it should throw
      await expect(getAvailableModelsAsync()).rejects.toThrow('main.ts is required but not found');
    });
  });

  describe('loadDefaultModel', () => {
    it('should load the main model in development mode', async () => {
      // Configure with test fixtures
      const customModels = [
        { id: 'main', path: './tests/fixtures/main.ts', name: 'Test Box', type: 'parametric' as const }
      ];
      configureModelDiscovery({ customModels });

      const result = await loadDefaultModel();

      expect(result).toHaveProperty('model');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('isParametric');

      // Should load main model (test box)
      expect(result.metadata?.name).toBe('Test Box');
      expect(result.isParametric).toBe(true);
    });
  });

  describe('loadModelById', () => {
    it('should load a static model correctly', async () => {
      // Configure with test fixtures
      const customModels = [
        { id: 'wheel', path: './tests/fixtures/components/wheel.ts', name: 'Wheel Component', type: 'static' as const }
      ];
      configureModelDiscovery({ customModels });

      const result = await loadModelById('wheel');

      expect(result).toHaveProperty('model');
      expect(result).toHaveProperty('metadata');
      expect(result.isParametric).toBe(false);
      expect(result.metadata?.name).toBe('Wheel Component');
    });

    it('should load a parametric model correctly', async () => {
      // Configure with test fixtures
      const customModels = [
        { id: 'main', path: './tests/fixtures/main.ts', name: 'Test Box', type: 'parametric' as const }
      ];
      configureModelDiscovery({ customModels });

      const result = await loadModelById('main');

      expect(result).toHaveProperty('model');
      expect(result).toHaveProperty('config');
      expect(result.isParametric).toBe(true);
      expect(result.config).toHaveProperty('parameters');
      expect(result.config).toHaveProperty('generateModel');
    });

    it('should throw error for non-existent model', async () => {
      // Configure with test fixtures so model discovery works
      const customModels = [
        { id: 'main', path: './tests/fixtures/main.ts', name: 'Test Box', type: 'parametric' as const }
      ];
      configureModelDiscovery({ customModels });

      await expect(loadModelById('non-existent')).rejects.toThrow('Model with ID "non-existent" not found');
    });
  });
});
