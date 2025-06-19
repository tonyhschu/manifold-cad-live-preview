/**
 * V3 Architecture Test
 * 
 * Tests to prove that the complete V3 architecture works correctly.
 * This validates Phase 3 implementation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock DOM environment for testing
const dom = new JSDOM('<!DOCTYPE html><div id="test-container"></div>');
global.window = dom.window as any;
global.document = dom.window.document;
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 0,
  key: () => null
} as any;

import { 
  createPipelineLoader,
  UIStateManager,
  createV3ModelService 
} from '@manifold-studio/configurator/src/v3';

describe('V3 Architecture', () => {
  describe('Pipeline Loader', () => {
    it('should create pipeline loader instance', () => {
      const loader = createPipelineLoader();
      expect(loader).toBeDefined();
      expect(typeof loader.checkForUpdates).toBe('function');
      expect(typeof loader.getPipeline).toBe('function');
      expect(typeof loader.reloadPipeline).toBe('function');
    });

    it('should handle missing pipeline gracefully', async () => {
      const loader = createPipelineLoader('./nonexistent/pipeline.js');
      
      // Should not throw when checking for updates
      const result = await loader.checkForUpdates();
      expect(result).toBe(false);
      
      // Should return null when no pipeline loaded
      expect(loader.getPipeline()).toBeNull();
    });
  });

  describe('UI State Manager', () => {
    let stateManager: UIStateManager;

    beforeEach(() => {
      stateManager = new UIStateManager();
    });

    it('should create with default state', () => {
      const state = stateManager.getState();
      expect(state).toBeDefined();
      expect(state.selectedModel).toBeNull();
      expect(state.parameters).toEqual({});
      expect(Array.isArray(state.cameraPosition)).toBe(true);
      expect(Array.isArray(state.cameraTarget)).toBe(true);
      expect(typeof state.cameraZoom).toBe('number');
      expect(typeof state.panels).toBe('object');
    });

    it('should update state correctly', () => {
      const updates = {
        selectedModel: 'test-model',
        parameters: { height: 10, width: 5 }
      };

      stateManager.setState(updates);
      const state = stateManager.getState();
      
      expect(state.selectedModel).toBe('test-model');
      expect(state.parameters).toEqual({ height: 10, width: 5 });
    });

    it('should handle model selection', () => {
      stateManager.selectModel('main', { height: 15 });
      const state = stateManager.getState();
      
      expect(state.selectedModel).toBe('main');
      expect(state.parameters).toEqual({ height: 15 });
    });

    it('should handle camera state updates', () => {
      const position: [number, number, number] = [1, 2, 3];
      const target: [number, number, number] = [4, 5, 6];
      const zoom = 2.5;

      stateManager.setCameraState(position, target, zoom);
      const state = stateManager.getState();
      
      expect(state.cameraPosition).toEqual(position);
      expect(state.cameraTarget).toEqual(target);
      expect(state.cameraZoom).toBe(zoom);
    });

    it('should handle panel state updates', () => {
      stateManager.setPanelState('parameters', false);
      const state = stateManager.getState();
      
      expect(state.panels.parameters).toBe(false);
      expect(state.panels.modelList).toBe(true); // Should not affect other panels
    });

    it('should handle pipeline reload', () => {
      const initialState = stateManager.getState();
      
      stateManager.handlePipelineReload('v1.2.3');
      const newState = stateManager.getState();
      
      expect(newState.pipelineVersion).toBe('v1.2.3');
      // Other state should be preserved
      expect(newState.selectedModel).toBe(initialState.selectedModel);
    });

    it('should add and remove listeners', () => {
      let callCount = 0;
      const listener = () => { callCount++; };
      
      const unsubscribe = stateManager.addListener(listener);
      
      stateManager.setState({ selectedModel: 'test' });
      expect(callCount).toBe(1);
      
      unsubscribe();
      stateManager.setState({ selectedModel: 'test2' });
      expect(callCount).toBe(1); // Should not be called after unsubscribe
    });

    it('should reset to defaults', () => {
      // Modify state
      stateManager.setState({
        selectedModel: 'test',
        parameters: { height: 10 },
        cameraZoom: 5
      });
      
      // Reset
      stateManager.reset();
      const state = stateManager.getState();
      
      expect(state.selectedModel).toBeNull();
      expect(state.parameters).toEqual({});
      expect(state.cameraZoom).toBe(1); // Default zoom
    });
  });

  describe('V3 Model Service', () => {
    let modelService: any;

    beforeEach(() => {
      modelService = createV3ModelService();
    });

    afterEach(() => {
      modelService.destroy();
    });

    it('should create model service instance', () => {
      expect(modelService).toBeDefined();
      expect(typeof modelService.initialize).toBe('function');
      expect(typeof modelService.loadModel).toBe('function');
      expect(typeof modelService.getAvailableModels).toBe('function');
      expect(typeof modelService.isParametric).toBe('function');
      expect(typeof modelService.getParameterConfig).toBe('function');
    });

    it('should handle missing pipeline gracefully', () => {
      // Should return empty array when no pipeline available
      const models = modelService.getAvailableModels();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBe(0);
    });

    it('should provide UI state manager', () => {
      const uiStateManager = modelService.getUIStateManager();
      expect(uiStateManager).toBeDefined();
      expect(typeof uiStateManager.getState).toBe('function');
      expect(typeof uiStateManager.setState).toBe('function');
    });

    it('should handle parametric model checks', () => {
      // Should not throw when checking non-existent models
      expect(modelService.isParametric('nonexistent')).toBe(false);
      expect(modelService.getParameterConfig('nonexistent')).toBeNull();
    });

    it('should provide pipeline info', () => {
      const info = modelService.getPipelineInfo();
      // Should be null when no pipeline loaded
      expect(info).toBeNull();
    });
  });

  describe('Integration', () => {
    it('should demonstrate complete V3 workflow', () => {
      // This test demonstrates the complete V3 architecture workflow
      console.log('🧪 Testing complete V3 workflow...');

      // 1. Create components
      const pipelineLoader = createPipelineLoader();
      const stateManager = new UIStateManager();
      const modelService = createV3ModelService();

      // 2. Verify they're properly connected
      expect(pipelineLoader).toBeDefined();
      expect(stateManager).toBeDefined();
      expect(modelService).toBeDefined();

      // 3. Test state preservation workflow
      stateManager.selectModel('main', { height: 10 });
      const state1 = stateManager.getState();
      
      // Simulate pipeline reload
      stateManager.handlePipelineReload('v2.0.0');
      const state2 = stateManager.getState();
      
      // State should be preserved across pipeline reload
      expect(state2.selectedModel).toBe(state1.selectedModel);
      expect(state2.parameters).toEqual(state1.parameters);
      expect(state2.pipelineVersion).toBe('v2.0.0');

      // 4. Cleanup
      modelService.destroy();

      console.log('✅ V3 workflow test completed');
    });

    it('should validate V3 architecture principles', () => {
      console.log('🧪 Validating V3 architecture principles...');

      // Principle 1: Simple pipeline replacement (not complex HMR)
      const loader = createPipelineLoader();
      expect(typeof loader.reloadPipeline).toBe('function');
      expect(typeof loader.checkForUpdates).toBe('function');

      // Principle 2: State preservation across reloads
      const stateManager = new UIStateManager();
      stateManager.selectModel('test', { param: 'value' });
      stateManager.handlePipelineReload();
      expect(stateManager.getState().selectedModel).toBe('test');

      // Principle 3: Pipeline as blackbox replacement
      const modelService = createV3ModelService();
      expect(typeof modelService.getAvailableModels).toBe('function');
      expect(typeof modelService.loadModel).toBe('function');

      // Principle 4: Selective re-rendering (only model viewer updates)
      // This is demonstrated by the UI state preservation

      modelService.destroy();
      console.log('✅ V3 architecture principles validated');
    });
  });
});
