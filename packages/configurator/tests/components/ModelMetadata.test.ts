/**
 * ModelMetadata Component Tests
 * Updated for V3 bridge system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock V3 UIStateManager
const mockUIStateManager = {
  getState: vi.fn(() => ({
    modelMetadata: null,
    currentModelId: 'demo',
    status: { message: 'Ready', isError: false }
  })),
  updateState: vi.fn(),
  subscribe: vi.fn(() => () => {}), // Return unsubscribe function
  loadFromUrl: vi.fn(),
  saveToUrl: vi.fn()
};

// Mock V3 bridge before importing component
vi.mock('../../src/state/v3-bridge', () => ({
  v3Signals: {
    isInitialized: {
      value: true,
      subscribe: vi.fn(() => () => {})
    },
    modelMetadata: {
      value: null,
      subscribe: vi.fn(() => () => {})
    },
    selectedModel: {
      value: null,
      subscribe: vi.fn(() => () => {})
    },
    availableModels: {
      value: [],
      subscribe: vi.fn(() => () => {})
    },
    modelParameters: {
      value: {},
      subscribe: vi.fn(() => () => {})
    },
    modelUrls: {
      value: { objUrl: '', glbUrl: '' },
      subscribe: vi.fn(() => () => {})
    },
    status: {
      value: { message: 'Ready', isError: false },
      subscribe: vi.fn(() => () => {})
    }
  },
  v3Actions: {
    updateStatus: vi.fn()
  },
  getV3UIStateManager: vi.fn(() => mockUIStateManager)
}));

import '../../src/components/context/ModelMetadata';

describe('ModelMetadata Component', () => {
  let element: HTMLElement;
  let mockV3Signals: any;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Import v3Signals after mocks are set up
    const { v3Signals } = await import('../../src/state/v3-bridge');
    mockV3Signals = v3Signals;

    // Reset V3 bridge state
    mockV3Signals.modelMetadata.value = null;

    // Create the component
    element = document.createElement('model-metadata');
    document.body.appendChild(element);

    // Wait for component initialization
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  afterEach(() => {
    // Clean up
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });

  it('should display no model message initially', () => {
    expect(element.textContent).toContain('Select a model to view details');
  });

  it('should display static model metadata', async () => {
    // Set static model metadata via V3 bridge
    mockV3Signals.modelMetadata.value = {
      name: 'Test Model',
      description: 'A test model for unit testing',
      author: 'Test Author',
      version: '1.0.0',
      tags: ['test', 'example']
    };

    // Trigger component update by calling the subscribe callback
    const subscribeCall = mockV3Signals.modelMetadata.subscribe.mock.calls[0];
    if (subscribeCall && subscribeCall[0]) {
      subscribeCall[0](mockV3Signals.modelMetadata.value);
    }

    // Wait for component to update
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(element.textContent).toContain('Test Model');
    expect(element.textContent).toContain('A test model for unit testing');
    expect(element.textContent).toContain('Author: Test Author');
    expect(element.textContent).toContain('Version: 1.0.0');
    expect(element.textContent).toContain('Tags: test, example');
  });

  it('should display parametric model metadata from V3 bridge', async () => {
    // Set parametric model metadata via V3 bridge
    mockV3Signals.modelMetadata.value = {
      name: 'Parametric Test',
      description: 'A parametric test model',
      author: 'Parametric Author',
      version: '2.0.0',
      tags: ['parametric', 'test']
    };

    // Trigger component update by calling the subscribe callback
    const subscribeCall = mockV3Signals.modelMetadata.subscribe.mock.calls[0];
    if (subscribeCall && subscribeCall[0]) {
      subscribeCall[0](mockV3Signals.modelMetadata.value);
    }

    // Wait for component to update
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(element.textContent).toContain('Parametric Test');
    expect(element.textContent).toContain('A parametric test model');
    expect(element.textContent).toContain('Author: Parametric Author');
    expect(element.textContent).toContain('Version: 2.0.0');
    expect(element.textContent).toContain('Tags: parametric, test');
  });

  it('should handle missing metadata gracefully', async () => {
    // Set minimal metadata via V3 bridge
    mockV3Signals.modelMetadata.value = {
      name: 'Minimal Model',
      description: ''
    };

    // Trigger component update by calling the subscribe callback
    const subscribeCall = mockV3Signals.modelMetadata.subscribe.mock.calls[0];
    if (subscribeCall && subscribeCall[0]) {
      subscribeCall[0](mockV3Signals.modelMetadata.value);
    }

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(element.textContent).toContain('Minimal Model');
    expect(element.textContent).not.toContain('Author:');
    expect(element.textContent).not.toContain('Version:');
  });
});
