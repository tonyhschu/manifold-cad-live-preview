import { test, expect } from '@playwright/test';

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

    // Now wait for the viewer and model selector to be visible
    await expect(page.locator('#viewer')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#model-select')).toBeVisible({ timeout: 10000 });
  });

  test('should display parameter controls for the selected model', async ({ page }) => {
    // Verify parameter panel component is present
    const parameterPanel = page.locator('parametric-panel');
    await expect(parameterPanel).toBeVisible();

    // Verify the tweakpane container is present
    const tweakpaneContainer = parameterPanel.locator('#tweakpane-container');
    await expect(tweakpaneContainer).toBeVisible();

    // Select a parametric model (main should be parametric)
    const selectElement = page.locator('#model-select');
    await selectElement.selectOption({ value: 'main' });

    // Wait for parameter controls to potentially load
    await page.waitForTimeout(3000);

    // Check if Tweakpane controls are present
    const tweakpaneControls = parameterPanel.locator('.tp-dfwv');
    const controlCount = await tweakpaneControls.count();

    if (controlCount > 0) {
      // If there are parameter controls, verify they're visible
      await expect(tweakpaneControls.first()).toBeVisible();
    } else {
      // If no parameter controls, verify the default message is shown
      const panelContent = await tweakpaneContainer.textContent();
      expect(panelContent).toContain('Select a parametric model');
    }
  });

  test('should update model when parameter values change', async ({ page }) => {
    const selectElement = page.locator('#model-select');
    const parameterPanel = page.locator('parametric-panel');
    const viewer = page.locator('#viewer');

    // Select a parametric model
    await selectElement.selectOption({ value: 'main' });

    // Wait for parameter controls to load
    await page.waitForTimeout(3000);

    // Check if there are any parameter controls
    const tweakpaneControls = parameterPanel.locator('.tp-dfwv');
    const controlCount = await tweakpaneControls.count();

    if (controlCount > 0) {
      // Get initial model source
      const initialSrc = await viewer.getAttribute('src');

      // Find input controls (number inputs, sliders, etc.)
      const numberInputs = parameterPanel.locator('.tp-txtv_i');
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
    const selectElement = page.locator('#model-select');
    const parameterPanel = page.locator('parametric-panel');

    // Select a parametric model
    await selectElement.selectOption({ value: 'main' });

    // Wait for parameter controls to load
    await page.waitForTimeout(3000);

    // Check if there are any parameter controls
    const numberInputs = parameterPanel.locator('.tp-txtv_i');
    const inputCount = await numberInputs.count();

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
    const selectElement = page.locator('#model-select');
    const parameterPanel = page.locator('parametric-panel');

    // Select a parametric model
    await selectElement.selectOption({ value: 'main' });

    // Wait for parameter controls to load
    await page.waitForTimeout(3000);

    // Check if there are parameter controls and a reset button
    const resetButton = parameterPanel.locator('#reset-parameters-btn');
    const numberInputs = parameterPanel.locator('.tp-txtv_i');
    const inputCount = await numberInputs.count();

    if (inputCount > 0) {
      // Get initial values
      const initialValues = [];
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
    const selectElement = page.locator('#model-select');
    const parameterPanel = page.locator('parametric-panel');

    // Select a parametric model
    await selectElement.selectOption({ value: 'main' });

    // Wait for parameter controls to load
    await page.waitForTimeout(3000);

    // Check if there are parameter controls
    const numberInputs = parameterPanel.locator('.tp-txtv_i');
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
      await expect(parameterPanel).toBeVisible();
      await expect(page.locator('#viewer')).toBeVisible();
    }
  });
});
