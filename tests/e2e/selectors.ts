import { Page, Locator } from '@playwright/test';

/**
 * Semantic selectors for E2E tests
 * 
 * This module provides semantic, user-focused selectors that are resilient to UI changes.
 * Following Kent C. Dodds' philosophy: "The more your tests resemble the way your software 
 * is used, the more confidence they can give you."
 * 
 * These selectors prioritize:
 * 1. Role-based queries (how users interact)
 * 2. Label-based queries (what users see)
 * 3. Text content queries (what users read)
 * 4. Only fall back to implementation details when necessary
 */

export class ManifoldStudioSelectors {
  constructor(private page: Page) {}

  /**
   * Model Selection
   * Users see this as "a dropdown to select which 3D model to view"
   */
  get modelSelector(): Locator {
    // Users would say: "Click on the Model dropdown"
    return this.page.getByRole('combobox', { name: /model/i });
  }

  /**
   * Get a specific model option by name
   * Users would say: "Select the Font Test model"
   */
  getModelOption(modelName: string): Locator {
    return this.page.getByRole('option', { name: new RegExp(modelName, 'i') });
  }

  /**
   * Parameter Controls
   * Users see these as "input fields to adjust the model"
   */
  get parametersSection(): Locator {
    // Users would say: "Look at the Parameters section"
    return this.page.getByRole('region', { name: /parameters/i })
      .or(this.page.locator('section').filter({ hasText: /parameters/i }))
      .or(this.page.locator('[data-testid="parametric-panel"]')); // Fallback for existing tests
  }

  /**
   * Get a parameter input by its label
   * Users would say: "Change the height parameter"
   */
  getParameterInput(parameterName: string): Locator {
    return this.page.getByRole('textbox', { name: new RegExp(parameterName, 'i') })
      .or(this.page.getByLabelText(new RegExp(parameterName, 'i')));
  }

  /**
   * 3D Viewer
   * Users see this as "the 3D model display area"
   */
  get modelViewer(): Locator {
    // Users would say: "Look at the 3D model"
    return this.page.getByRole('img', { name: /parametric model/i })
      .or(this.page.locator('model-viewer'))
      .or(this.page.locator('#viewer'));
  }

  /**
   * Status Messages
   * Users see these as feedback about what's happening
   */
  get successMessage(): Locator {
    // Users would see: "Model loaded successfully"
    return this.page.getByText(/model loaded successfully/i);
  }

  get errorMessage(): Locator {
    // Users would see error messages
    return this.page.locator('.error-message')
      .or(this.page.getByRole('alert'))
      .or(this.page.getByText(/error/i));
  }

  /**
   * Action Buttons
   * Users see these as "buttons to do things"
   */
  get downloadButton(): Locator {
    // Users would say: "Click the Download button"
    return this.page.getByRole('button', { name: /download/i });
  }

  get resetButton(): Locator {
    // Users would say: "Click the Reset button"
    return this.page.getByRole('button', { name: /reset/i });
  }

  get canvas(): Locator {
    // Users would see the 3D viewer canvas - use the specific WebGL canvas
    return this.page.locator('#webgl-canvas');
  }

  /**
   * Application State
   * Methods to check if the app is in expected states
   */
  async waitForAppReady(): Promise<void> {
    // Wait for the model selector to be available (app is loaded)
    await this.modelSelector.waitFor({ state: 'visible', timeout: 10000 });
  }

  async waitForModelLoaded(): Promise<void> {
    // Wait for success message indicating model is loaded
    await this.successMessage.waitFor({ state: 'visible', timeout: 10000 });
  }

  async selectModel(modelName: string): Promise<void> {
    // Select a model by name (how a user would do it)
    await this.modelSelector.selectOption({ label: modelName });
  }

  async selectModelByValue(modelValue: string): Promise<void> {
    // Select a model by value (for when we know the internal ID)
    await this.modelSelector.selectOption({ value: modelValue });
  }

  /**
   * Convenience method to check if a model option exists
   */
  async hasModelOption(modelName: string): Promise<boolean> {
    try {
      await this.getModelOption(modelName).waitFor({ state: 'attached', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Factory function to create selectors for a page
 * Usage: const selectors = createSelectors(page);
 */
export function createSelectors(page: Page): ManifoldStudioSelectors {
  return new ManifoldStudioSelectors(page);
}

/**
 * Legacy compatibility - provides the old selector patterns for gradual migration
 * @deprecated Use semantic selectors instead
 */
export const legacySelectors = {
  modelList: '[data-testid="model-list"]',
  modelSelect: '#model-select',
  parametricPanel: '[data-testid="parametric-panel"]',
};
