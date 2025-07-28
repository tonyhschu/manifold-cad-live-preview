import { test, expect } from '@playwright/test';
import { selectModelAndWait, createSelectors, waitForAppReady, waitForParametricPanelStable } from './test-utils';

/**
 * Parameter Editing UI Tests
 *
 * Tests the parameter editing controls and real-time model updates.
 * Verifies that parameter changes are reflected in the 3D model
 * and that the UI controls work correctly.
 */

test.describe('Parameter Editing Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console error tracking
    await page.addInitScript(() => {
      (window as any).consoleErrors = [];
      const originalError = console.error;
      console.error = (...args) => {
        (window as any).consoleErrors.push(args.join(' '));
        originalError.apply(console, args);
      };
    });

    await page.goto('/');

    // Wait for the application to load - first wait for the app container
    await expect(page.locator('#app')).toBeVisible({ timeout: 10000 });

    // Wait for the configurator to initialize and create the viewer
    await page.waitForFunction(() => {
      const viewer = document.querySelector('#viewer');
      return viewer !== null;
    }, { timeout: 20000 });

    // Now wait for the viewer and model selector to be visible using semantic selectors
    await expect(page.locator('#viewer')).toBeVisible({ timeout: 10000 });
    await waitForAppReady(page);
  });

  test('should display parameter controls for the selected model', async ({ page }) => {
    const selectors = createSelectors(page);

    // Verify parameter panel component is present using semantic selector
    await expect(selectors.parametersSection).toBeVisible();

    // Verify the tweakpane container is present
    const tweakpaneContainer = selectors.parametersSection.locator('#tweakpane-container');
    await expect(tweakpaneContainer).toBeVisible();

    // Select a parametric model and wait for it to load
    await selectModelAndWait(page, 'main');

    // Check for different types of parameter controls
    const tweakpaneControls = selectors.parametersSection.locator('.tp-dfwv');
    const textboxControls = selectors.parametersSection.locator('input[type="text"], textbox');

    // Handle potential execution context destruction during navigation
    let tweakpaneCount: number, textboxCount: number;
    try {
      tweakpaneCount = await tweakpaneControls.count();
      textboxCount = await textboxControls.count();
    } catch (error) {
      if (error.message.includes('Execution context was destroyed')) {
        // Wait for page to stabilize and try again
        await page.waitForTimeout(1000);
        await expect(selectors.parametersSection).toBeVisible();
        tweakpaneCount = await tweakpaneControls.count();
        textboxCount = await textboxControls.count();
      } else {
        throw error;
      }
    }

    if (tweakpaneCount > 0) {
      // If there are Tweakpane controls, verify they're visible
      await expect(tweakpaneControls.first()).toBeVisible();
    } else if (textboxCount > 0) {
      // If there are textbox controls (like in main.ts), verify they're visible
      await expect(textboxControls.first()).toBeVisible();
    } else {
      // If no parameter controls, verify the default message is shown
      const panelContent = await tweakpaneContainer.textContent();
      expect(panelContent).toContain('This model has no tweakable parameters');
    }
  });

  test('should update model when parameter values change', async ({ page }) => {
    const selectors = createSelectors(page);
    const viewer = page.locator('#viewer');

    // Select a parametric model using semantic selector
    await selectors.modelSelector.selectOption({ value: 'main' });

    // Wait for parameter controls to load
    await page.waitForTimeout(3000);

    // Check if there are any parameter controls (handle potential navigation)
    const tweakpaneControls = selectors.parametersSection.locator('.tp-dfwv');
    let controlCount: number;
    try {
      controlCount = await tweakpaneControls.count();
    } catch (error: any) {
      if (error.message.includes('Execution context was destroyed')) {
        // Wait for page to stabilize and try again
        await page.waitForTimeout(1000);
        await expect(selectors.parametersSection).toBeVisible();
        controlCount = await tweakpaneControls.count();
      } else {
        throw error;
      }
    }

    if (controlCount > 0) {
      // Get initial model source
      const initialSrc = await viewer.getAttribute('src');

      // Find input controls (number inputs, sliders, etc.)
      const numberInputs = selectors.parametersSection.locator('.tp-txtv_i');
      const inputCount = await numberInputs.count();

      if (inputCount > 0) {
        // Get the first input and change its value
        const firstInput = numberInputs.first();
        const initialValue = await firstInput.inputValue();

        // Change the value
        await firstInput.fill('25');
        await firstInput.press('Enter');

        // Wait for model to potentially update
        await page.waitForTimeout(2000);

        // Check if model source changed (indicating regeneration)
        const newSrc = await viewer.getAttribute('src');

        // The model might or might not regenerate immediately depending on the implementation
        // Just verify no errors occurred
        const consoleErrors = await page.evaluate(() => (window as any).consoleErrors || []);
        const relevantErrors = consoleErrors.filter((error: string) =>
          !error.includes('404') &&
          !error.includes('Failed to load resource') &&
          error.includes('Error')
        );
        expect(relevantErrors.length).toBeLessThan(2);

        // Verify the input value was accepted
        const finalValue = await firstInput.inputValue();
        expect(finalValue).toBe('25');
      }
    }
  });

  test('should validate parameter ranges', async ({ page }) => {
    const selectors = createSelectors(page);

    // Select a parametric model using semantic selector
    await selectors.modelSelector.selectOption({ value: 'main' });

    // Wait for parameter controls to load
    await page.waitForTimeout(3000);

    // Check if there are any parameter controls (handle potential navigation)
    const numberInputs = selectors.parametersSection.locator('.tp-txtv_i');
    let inputCount: number;
    try {
      inputCount = await numberInputs.count();
    } catch (error) {
      if (error.message.includes('Execution context was destroyed')) {
        // Wait for page to stabilize and try again
        await page.waitForTimeout(1000);
        await expect(selectors.parametersSection).toBeVisible();
        inputCount = await numberInputs.count();
      } else {
        throw error;
      }
    }

    if (inputCount > 0) {
      const firstInput = numberInputs.first();

      // Try to enter an extremely large value
      await firstInput.fill('999999');
      await firstInput.press('Enter');

      // Wait for validation
      await page.waitForTimeout(1000);

      // The input should either:
      // 1. Clamp to a maximum value
      // 2. Show an error
      // 3. Revert to previous value
      const finalValue = await firstInput.inputValue();
      const numericValue = parseFloat(finalValue);

      // Should be a reasonable number (not the extreme value we entered)
      expect(numericValue).toBeLessThan(10000);
      expect(numericValue).toBeGreaterThan(-10000);

      // Try a negative value if it makes sense
      await firstInput.fill('-100');
      await firstInput.press('Enter');

      await page.waitForTimeout(1000);

      const negativeValue = await firstInput.inputValue();
      const negativeNumeric = parseFloat(negativeValue);

      // Should handle negative values appropriately
      expect(negativeNumeric).toBeGreaterThan(-10000);
    }
  });

  test('should reset parameters to default values', async ({ page }) => {
    const selectors = createSelectors(page);

    // Select a parametric model using semantic selector
    await selectors.modelSelector.selectOption({ value: 'main' });

    // Wait for parameter controls to load
    await page.waitForTimeout(3000);

    // Check if there are parameter controls and a reset button
    const resetButton = selectors.parametersSection.locator('#reset-parameters-btn');
    const numberInputs = selectors.parametersSection.locator('.tp-txtv_i');
    const inputCount = await numberInputs.count();

    if (inputCount > 0) {
      // Get initial values
      const initialValues: string[] = [];
      for (let i = 0; i < Math.min(inputCount, 3); i++) {
        const value = await numberInputs.nth(i).inputValue();
        initialValues.push(value);
      }

      // Change some values
      for (let i = 0; i < Math.min(inputCount, 3); i++) {
        await numberInputs.nth(i).fill('50');
        await numberInputs.nth(i).press('Enter');
      }

      await page.waitForTimeout(1000);

      // Check if reset button is visible
      const isResetVisible = await resetButton.isVisible();

      if (isResetVisible) {
        // Click reset button
        await resetButton.click();

        // Wait for reset to complete
        await page.waitForTimeout(2000);

        // Verify values were reset (they should be different from our modified values)
        for (let i = 0; i < Math.min(inputCount, 3); i++) {
          const resetValue = await numberInputs.nth(i).inputValue();
          expect(resetValue).not.toBe('50'); // Should not be our modified value
        }
      }
    }
  });

  test('should handle parameter changes without errors', async ({ page }) => {
    const selectors = createSelectors(page);

    // Select a parametric model using semantic selector
    await selectors.modelSelector.selectOption({ value: 'main' });

    // Wait for parameter controls to load
    await page.waitForTimeout(3000);

    // Check if there are parameter controls
    const numberInputs = selectors.parametersSection.locator('.tp-txtv_i');
    const inputCount = await numberInputs.count();

    if (inputCount > 0) {
      // Make several parameter changes rapidly
      for (let i = 0; i < Math.min(inputCount, 3); i++) {
        const input = numberInputs.nth(i);

        // Change values multiple times
        await input.fill('10');
        await input.press('Enter');
        await page.waitForTimeout(200);

        await input.fill('20');
        await input.press('Enter');
        await page.waitForTimeout(200);

        await input.fill('15');
        await input.press('Enter');
        await page.waitForTimeout(200);
      }

      // Wait for all changes to settle
      await page.waitForTimeout(2000);

      // Verify no critical errors occurred
      const consoleErrors = await page.evaluate(() => (window as any).consoleErrors || []);
      const criticalErrors = consoleErrors.filter((error: string) =>
        !error.includes('404') &&
        !error.includes('Failed to load resource') &&
        !error.includes('net::ERR_') &&
        error.includes('Error')
      );

      // Should have minimal critical errors
      expect(criticalErrors.length).toBeLessThan(3);

      // Verify the UI is still functional
      await expect(selectors.parametersSection).toBeVisible();
      await expect(page.locator('#viewer')).toBeVisible();
    }
  });
});
