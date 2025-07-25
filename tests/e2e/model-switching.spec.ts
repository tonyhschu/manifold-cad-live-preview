import { test, expect } from '@playwright/test';
import { evaluateWithRetry, waitForParametricPanelStable } from './test-utils';

/**
 * Model Switching UI Tests
 *
 * Tests the model switching functionality in the Manifold Studio UI.
 * Verifies that users can switch between different models and that
 * the UI updates correctly.
 */

test.describe('Model Switching Tests', () => {
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

  test('should display model selector with available models', async ({ page }) => {
    // Verify model selector component is present
    const modelSelector = page.locator('model-selector');
    await expect(modelSelector).toBeVisible();

    // Verify the select element inside the component
    const selectElement = page.locator('#model-select');
    await expect(selectElement).toBeVisible();

    // Should have at least the main model and component model
    const options = selectElement.locator('option');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);

    // Verify options have meaningful text
    const firstOptionText = await options.first().textContent();
    expect(firstOptionText).toBeTruthy();
    expect(firstOptionText?.length).toBeGreaterThan(0);
  });

  test('should switch between models correctly', async ({ page }) => {
    const selectElement = page.locator('#model-select');
    const viewer = page.locator('#viewer');

    // Get initial model source
    const initialSrc = await viewer.getAttribute('src');

    // Get all available options
    const options = selectElement.locator('option');
    const optionCount = await options.count();

    if (optionCount > 1) {
      // Get the value of the second option
      const secondOptionValue = await options.nth(1).getAttribute('value');

      // Switch to the second model
      await selectElement.selectOption({ index: 1 });

      // Wait for model to load (src should change)
      await page.waitForFunction(
        (initialSrc) => {
          const viewer = document.querySelector('#viewer') as any;
          return viewer && viewer.src && viewer.src !== initialSrc;
        },
        initialSrc,
        { timeout: 10000 }
      );

      // Verify the selection changed
      const selectedValue = await selectElement.inputValue();
      expect(selectedValue).toBe(secondOptionValue);

      // Verify no console errors during model switching (handle potential navigation)
      const consoleErrors = await evaluateWithRetry(page, () => (window as any).consoleErrors || []);
      const relevantErrors = consoleErrors.filter((error: string) =>
        !error.includes('404') &&
        !error.includes('Failed to load resource')
      );
      expect(relevantErrors).toHaveLength(0);
    }
  });

  test('should update parameter controls when switching models', async ({ page }) => {
    const selectElement = page.locator('#model-select');
    const parameterPanel = page.locator('parametric-panel');

    // Wait for parameter panel to be present
    await expect(parameterPanel).toBeVisible();

    // Get all available options
    const options = selectElement.locator('option');
    const optionCount = await options.count();

    if (optionCount > 1) {
      // Try switching between different models
      for (let i = 0; i < Math.min(optionCount, 3); i++) {
        await selectElement.selectOption({ index: i });

        // Wait for parameter panel to stabilize after model switch
        await waitForParametricPanelStable(page);

        // Verify parameter panel is still visible
        await expect(parameterPanel).toBeVisible();

        // Check if the panel content updated
        const panelContent = await parameterPanel.textContent();
        expect(panelContent).toBeTruthy();

        // If this is a parametric model, there might be Tweakpane controls
        const tweakpaneContainer = parameterPanel.locator('#tweakpane-container');
        await expect(tweakpaneContainer).toBeVisible();
      }
    }
  });

  test('should update 3D canvas when switching models', async ({ page }) => {
    const selectElement = page.locator('#model-select');
    const viewer = page.locator('#viewer');

    // Get initial model source (use JavaScript property, not HTML attribute)
    const initialSrc = await viewer.evaluate((el: any) => el.src);

    // Get all available options
    const options = selectElement.locator('option');
    const optionCount = await options.count();

    if (optionCount > 1) {
      // Switch to a different model
      await selectElement.selectOption({ index: 1 });

      // Wait for model to load (src should change)
      await page.waitForFunction(
        (initialSrc) => {
          const viewer = document.querySelector('#viewer') as any;
          return viewer && viewer.src && viewer.src !== initialSrc;
        },
        initialSrc,
        { timeout: 10000 }
      );

      // Verify the model viewer is still visible and functional
      await expect(viewer).toBeVisible();

      // Verify the src property changed (handle potential navigation)
      let newSrc;
      try {
        newSrc = await viewer.evaluate((el: any) => el.src);
      } catch (error) {
        // If execution context was destroyed, wait for page to stabilize and try again
        if (error.message.includes('Execution context was destroyed')) {
          await page.waitForTimeout(1000);
          await expect(viewer).toBeVisible();
          newSrc = await viewer.evaluate((el: any) => el.src);
        } else {
          throw error;
        }
      }
      expect(newSrc).not.toBe(initialSrc);
      expect(newSrc).toBeTruthy();

      // Verify model-viewer is still interactive (has camera-controls)
      const hasCameraControls = await viewer.getAttribute('camera-controls');
      expect(hasCameraControls).not.toBeNull();
    }
  });
});
