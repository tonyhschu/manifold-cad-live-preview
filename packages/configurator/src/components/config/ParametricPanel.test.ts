import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParametricPanel } from './ParametricPanel';
import type { ParametricConfig } from '@manifold-studio/wrapper';

// Mock the store
vi.mock('../../state/store', () => ({
  currentParametricConfig: {
    subscribe: vi.fn((callback) => {
      // Return unsubscribe function
      return () => {};
    })
  },
  updateModel: vi.fn(),
  modelUrls: { value: null }
}));

// Mock the services
vi.mock('../../services', () => ({
  getExportService: vi.fn(() => ({
    exportToOBJ: vi.fn().mockResolvedValue({ url: 'test.obj' }),
    exportToGLB: vi.fn().mockResolvedValue({ url: 'test.glb' })
  }))
}));

// Mock the parameter manager
vi.mock('../../core/parameter-manager', () => ({
  ParameterManager: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    getParameters: vi.fn(() => ({ param1: 10, param2: 'test' })),
    setParameter: vi.fn(),
    resetToDefaults: vi.fn()
  }))
}));

describe('ParametricPanel', () => {
  let panel: ParametricPanel;
  let mockConfig: ParametricConfig;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Create a fresh panel instance
    panel = new ParametricPanel();
    document.body.appendChild(panel);

    // Mock parametric config
    mockConfig = {
      name: 'test-model',
      parameters: {
        param1: { value: 10, min: 0, max: 100 },
        param2: { value: 'default', options: ['default', 'option1', 'option2'] }
      },
      generateModel: vi.fn()
    } as any;
  });

  afterEach(() => {
    document.body.removeChild(panel);
  });

  it('should create reset button in header', () => {
    const resetButton = panel.querySelector('#reset-parameters-btn') as HTMLButtonElement;
    expect(resetButton).toBeTruthy();
    expect(resetButton.textContent).toBe('Reset');
    expect(resetButton.style.display).toBe('none'); // Initially hidden
  });

  it('should show reset button when parametric config is loaded', () => {
    const resetButton = panel.querySelector('#reset-parameters-btn') as HTMLButtonElement;
    
    // Simulate config change
    panel.loadParametricModel(mockConfig);
    
    expect(resetButton.style.display).toBe('inline-block');
  });

  it('should hide reset button when no parametric config', () => {
    const resetButton = panel.querySelector('#reset-parameters-btn') as HTMLButtonElement;
    
    // First show it
    panel.loadParametricModel(mockConfig);
    expect(resetButton.style.display).toBe('inline-block');
    
    // Then simulate clearing config
    (panel as any).handleConfigChange(null);
    expect(resetButton.style.display).toBe('none');
  });

  it('should call resetToDefaults when reset button is clicked', () => {
    const resetButton = panel.querySelector('#reset-parameters-btn') as HTMLButtonElement;
    
    // Load parametric model to create parameter manager
    panel.loadParametricModel(mockConfig);
    
    // Get the mocked parameter manager instance
    const parameterManager = (panel as any).parameterManager;
    
    // Click the reset button
    resetButton.click();
    
    // Verify resetToDefaults was called
    expect(parameterManager.resetToDefaults).toHaveBeenCalledOnce();
  });

  it('should have resetParameters public method', () => {
    expect(typeof panel.resetParameters).toBe('function');
  });

  it('should call parameter manager resetToDefaults through public API', () => {
    // Load parametric model to create parameter manager
    panel.loadParametricModel(mockConfig);
    
    // Get the mocked parameter manager instance
    const parameterManager = (panel as any).parameterManager;
    
    // Call public reset method
    panel.resetParameters();
    
    // Verify resetToDefaults was called
    expect(parameterManager.resetToDefaults).toHaveBeenCalledOnce();
  });

  it('should handle resetParameters gracefully when no parameter manager exists', () => {
    // Call reset without loading a parametric model
    expect(() => panel.resetParameters()).not.toThrow();
  });
});
