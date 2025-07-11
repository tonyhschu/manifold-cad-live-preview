/**
 * ModelMetadata Component Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { modelMetadata } from '../../src/state/store';
import '../../src/components/context/ModelMetadata';

describe('ModelMetadata Component', () => {
  let element: HTMLElement;

  beforeEach(() => {
    // Create the component
    element = document.createElement('model-metadata');
    document.body.appendChild(element);
    
    // Reset store state
    modelMetadata.value = null;
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
    // Set static model metadata
    modelMetadata.value = {
      name: 'Test Model',
      description: 'A test model for unit testing',
      author: 'Test Author',
      version: '1.0.0',
      tags: ['test', 'example']
    };

    // Wait for component to update
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(element.textContent).toContain('Test Model');
    expect(element.textContent).toContain('A test model for unit testing');
    expect(element.textContent).toContain('Author: Test Author');
    expect(element.textContent).toContain('Version: 1.0.0');
    expect(element.textContent).toContain('Tags: test, example');
  });

  it('should display parametric model metadata from modelMetadata signal', async () => {
    // Set parametric model metadata (now comes through single source of truth)
    modelMetadata.value = {
      name: 'Parametric Test',
      description: 'A parametric test model',
      author: 'Parametric Author',
      version: '2.0.0',
      tags: ['parametric', 'test']
    };

    // Wait for component to update
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(element.textContent).toContain('Parametric Test');
    expect(element.textContent).toContain('A parametric test model');
    expect(element.textContent).toContain('Author: Parametric Author');
    expect(element.textContent).toContain('Version: 2.0.0');
    expect(element.textContent).toContain('Tags: parametric, test');
  });

  it('should handle missing metadata gracefully', async () => {
    // Set minimal metadata
    modelMetadata.value = {
      name: 'Minimal Model',
      description: ''
    };

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(element.textContent).toContain('Minimal Model');
    expect(element.textContent).not.toContain('Author:');
    expect(element.textContent).not.toContain('Version:');
  });
});
