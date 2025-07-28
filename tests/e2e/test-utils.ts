import { Page } from '@playwright/test';
import { createSelectors, ManifoldStudioSelectors } from './selectors';

// Re-export for convenience
export { createSelectors, ManifoldStudioSelectors };

/**
 * Test utilities for E2E tests
 *
 * This module provides common utilities for Playwright E2E tests to handle:
 * - Timing issues with parametric panel loading
 * - Execution context destruction during navigation
 * - Model loading and selection workflows
 *
 * These utilities help make tests more reliable and reduce code duplication.
 * Updated to use semantic selectors following Kent C. Dodds' philosophy.
 */

/**
 * Waits for the parametric panel to reach a stable state after model selection.
 * This handles the timing between model selection and parameter controls loading.
 * 
 * @param page - Playwright page instance
 * @param timeout - Maximum time to wait in milliseconds (default: 10000)
 * @returns Promise that resolves when the panel is in a stable state
 */
export async function waitForParametricPanelStable(page: Page, timeout: number = 10000): Promise<void> {
  await page.waitForFunction(() => {
    const panel = document.querySelector('parametric-panel');
    const container = panel?.querySelector('#tweakpane-container');
    const content = container?.textContent || '';
    
    // Panel is stable when it shows either:
    // 1. Parameter controls (input elements present)
    // 2. "No parameters" message
    // 3. Not the initial "Select a parametric model" message
    const hasParameterControls = (panel?.querySelectorAll('input[type="text"]').length || 0) > 0;
    const hasNoParametersMessage = content.includes('This model has no tweakable parameters');
    const isNotInitialState = !content.includes('Select a parametric model to configure');
    
    return hasParameterControls || hasNoParametersMessage || isNotInitialState;
  }, { timeout });
}

/**
 * Handles potential execution context destruction during page navigation.
 * This is a common issue when model switching triggers page reloads.
 * 
 * @param page - Playwright page instance
 * @param evaluateFunction - Function to evaluate in the page context
 * @param retryDelay - Delay before retry in milliseconds (default: 1000)
 * @returns Promise with the result of the evaluation
 */
export async function evaluateWithRetry<T>(
  page: Page, 
  evaluateFunction: () => T, 
  retryDelay: number = 1000
): Promise<T> {
  try {
    return await page.evaluate(evaluateFunction);
  } catch (error: any) {
    if (error.message.includes('Execution context was destroyed')) {
      // Wait for page to stabilize and try again
      await page.waitForTimeout(retryDelay);
      return await page.evaluate(evaluateFunction);
    } else {
      throw error;
    }
  }
}

/**
 * Waits for model loading to complete by checking for the success message.
 * Uses semantic selectors to find the success message.
 *
 * @param page - Playwright page instance
 * @param timeout - Maximum time to wait in milliseconds (default: 10000)
 */
export async function waitForModelLoaded(page: Page, timeout: number = 10000): Promise<void> {
  const selectors = createSelectors(page);
  await selectors.successMessage.waitFor({ state: 'visible', timeout });
}

/**
 * Selects a model and waits for it to load completely.
 * Uses semantic selectors to interact with the model selector.
 *
 * @param page - Playwright page instance
 * @param modelValue - The value attribute of the model option to select
 * @param waitForStable - Whether to wait for parametric panel to stabilize (default: true)
 */
export async function selectModelAndWait(
  page: Page,
  modelValue: string,
  waitForStable: boolean = true
): Promise<void> {
  const selectors = createSelectors(page);
  await selectors.selectModelByValue(modelValue);

  // Wait for model to load
  await waitForModelLoaded(page);

  // Wait for parametric panel to stabilize if requested
  if (waitForStable) {
    await waitForParametricPanelStable(page);
  }
}

/**
 * Selects a model by name (user-friendly) and waits for it to load.
 *
 * @param page - Playwright page instance
 * @param modelName - The display name of the model to select
 * @param waitForStable - Whether to wait for parametric panel to stabilize (default: true)
 */
export async function selectModelByNameAndWait(
  page: Page,
  modelName: string,
  waitForStable: boolean = true
): Promise<void> {
  const selectors = createSelectors(page);
  await selectors.selectModel(modelName);

  // Wait for model to load
  await waitForModelLoaded(page);

  // Wait for parametric panel to stabilize if requested
  if (waitForStable) {
    await waitForParametricPanelStable(page);
  }
}

/**
 * Waits for the application to be ready for testing.
 * Uses semantic selectors to determine when the app is loaded.
 *
 * @param page - Playwright page instance
 * @param timeout - Maximum time to wait in milliseconds (default: 10000)
 */
export async function waitForAppReady(page: Page, timeout: number = 10000): Promise<void> {
  const selectors = createSelectors(page);
  await selectors.waitForAppReady();
}
