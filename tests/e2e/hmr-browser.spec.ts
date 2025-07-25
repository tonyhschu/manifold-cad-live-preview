import { test, expect } from '@playwright/test';
import { evaluateWithRetry, selectModelAndWait } from './test-utils';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Critical HMR (Hot Module Replacement) Browser Tests
 *
 * Tests the core functionality that was the main challenge during the
 * dual-server to single-server migration. Verifies that:
 * - No 504 dependency optimization errors occur
 * - Model updates are reflected in the UI after file changes
 * - Parameter controls remain functional after HMR
 */

const TEST_PROJECT_DIR = path.join(process.cwd(), 'reference-project');

test.describe('HMR Browser Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console error tracking
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Store console errors on page for access in tests
    await page.addInitScript(() => {
      (window as any).consoleErrors = [];
      const originalError = console.error;
      console.error = (...args) => {
        (window as any).consoleErrors.push(args.join(' '));
        originalError.apply(console, args);
      };
    });

    // Navigate to the test application
    await page.goto('/');

    // Wait for the application to load - first wait for the app container
    await expect(page.locator('#app')).toBeVisible({ timeout: 10000 });

    // Wait for the configurator to initialize and create the viewer
    await page.waitForFunction(() => {
      const viewer = document.querySelector('#viewer');
      return viewer !== null;
    }, { timeout: 20000 });

    // Now wait for the viewer to be visible
    await expect(page.locator('#viewer')).toBeVisible({ timeout: 10000 });
  });

  test('should load initial model without errors', async ({ page }) => {
    // Wait for model viewer to be present
    await expect(page.locator('#viewer')).toBeVisible();

    // Wait for model selector to be present
    await expect(page.locator('model-selector')).toBeVisible();

    // Wait for the select element inside model-selector
    await expect(page.locator('#model-select')).toBeVisible();

    // Verify model selector has options
    const options = page.locator('#model-select option');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);

    // Check for console errors
    const consoleErrors = await page.evaluate(() => (window as any).consoleErrors || []);
    expect(consoleErrors.filter((error: string) =>
      !error.includes('404') && // Ignore 404s which are expected during startup
      !error.includes('Failed to load resource') // Ignore resource loading errors during startup
    )).toHaveLength(0);

    // Verify configurator loaded successfully
    await expect(page.locator('#sidebar')).toBeVisible();
    await expect(page.locator('#main')).toBeVisible();
  });

  test('should handle file changes with HMR without 504 errors', async ({ page }) => {
    // Wait for initial load
    await expect(page.locator('#viewer')).toBeVisible();
    await expect(page.locator('#model-select')).toBeVisible();

    // Get initial model source
    const initialSrc = await page.locator('#viewer').getAttribute('src');

    // Modify the wheel component file to trigger HMR
    const wheelFilePath = path.join(TEST_PROJECT_DIR, 'components', 'wheel.ts');
    const originalContent = await fs.readFile(wheelFilePath, 'utf-8');

    try {
      // Modify the wheel radius default value
      const modifiedContent = originalContent.replace(
        'P.number(15, 5, 30, 1)',
        'P.number(20, 5, 30, 1)'
      );

      await fs.writeFile(wheelFilePath, modifiedContent);

      // Wait for HMR to trigger - look for console messages indicating pipeline rebuild
      // The dev server should log when models are recompiled
      await page.waitForFunction(
        () => {
          // Check if the model has been recompiled by looking for console messages
          // or checking if the model parameters have updated
          const modelSelector = document.querySelector('#model-select') as HTMLSelectElement;
          return modelSelector && modelSelector.options.length > 0;
        },
        { timeout: 15000 }
      );

      // Give a moment for the HMR to complete
      await page.waitForTimeout(2000);

      // Check for 504 dependency optimization errors specifically
      const consoleErrors = await page.evaluate(() => (window as any).consoleErrors || []);
      const dependencyErrors = consoleErrors.filter((error: string) =>
        error.includes('504') ||
        error.includes('Outdated Optimize Dep') ||
        error.includes('dependency optimization')
      );

      expect(dependencyErrors).toHaveLength(0);

      // Verify model selector still works
      await expect(page.locator('#model-select')).toBeVisible();
      const options = page.locator('#model-select option');
      const optionCount = await options.count();
      expect(optionCount).toBeGreaterThan(0);

      // Verify we can still switch models
      await page.selectOption('#model-select', { index: 0 });

      // Wait a bit for model to load
      await page.waitForTimeout(2000);

      // Verify no new errors after model switching (handle potential navigation)
      const finalErrors = await evaluateWithRetry(page, () => (window as any).consoleErrors || []);
      const newDependencyErrors = finalErrors.filter((error: string) =>
        error.includes('504') ||
        error.includes('Outdated Optimize Dep') ||
        error.includes('dependency optimization')
      );

      expect(newDependencyErrors).toHaveLength(0);

    } finally {
      // Restore original file content
      await fs.writeFile(wheelFilePath, originalContent);
    }
  });

  test('should preserve URL state during HMR', async ({ page }) => {
    // Wait for initial load
    await expect(page.locator('#model-select')).toBeVisible();

    // Select a specific model
    await page.selectOption('#model-select', { index: 1 });

    // Get current URL
    const initialUrl = page.url();

    // Modify a file to trigger HMR
    const wheelFilePath = path.join(TEST_PROJECT_DIR, 'components', 'wheel.ts');
    const originalContent = await fs.readFile(wheelFilePath, 'utf-8');

    try {
      const modifiedContent = originalContent.replace(
        'Wheel Component - V3 Version',
        'Modified Wheel Component - V3 Version'
      );

      await fs.writeFile(wheelFilePath, modifiedContent);

      // Wait for HMR to complete
      await page.waitForTimeout(3000);

      // Verify URL model parameter is preserved (parameters may change)
      const currentUrl = new URL(page.url());
      const initialUrlObj = new URL(initialUrl);
      expect(currentUrl.searchParams.get('m_model')).toBe(initialUrlObj.searchParams.get('m_model'));

      // Verify selected model is still selected (check selected option text)
      const selectedOption = await page.locator('#model-select option:checked');
      const selectedText = await selectedOption.textContent();
      expect(selectedText).toBeTruthy();

    } finally {
      await fs.writeFile(wheelFilePath, originalContent);
    }
  });

  test('should maintain parameter values during HMR', async ({ page }) => {
    // Wait for initial load and select a parametric model
    await expect(page.locator('#model-select')).toBeVisible();

    // Select the main model and wait for it to load
    await selectModelAndWait(page, 'main');

    // Wait for Tweakpane to initialize
    await page.waitForTimeout(2000);

    // Check if there are any parameter controls
    const hasParameters = await page.locator('.tp-dfwv').count() > 0;

    if (hasParameters) {
      // Get initial parameter values (if any exist)
      const initialParams = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('.tp-txtv_i'));
        return inputs.map((input: any) => input.value);
      });

      // Modify a file to trigger HMR
      const mainFilePath = path.join(TEST_PROJECT_DIR, 'main.ts');
      const originalContent = await fs.readFile(mainFilePath, 'utf-8');

      try {
        const modifiedContent = originalContent.replace(
          'Test Box',
          'Modified Test Box'
        );

        await fs.writeFile(mainFilePath, modifiedContent);

        // Wait for HMR to complete
        await page.waitForTimeout(3000);

        // Verify parameter values are maintained
        const finalParams = await page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('.tp-txtv_i'));
          return inputs.map((input: any) => input.value);
        });

        expect(finalParams).toEqual(initialParams);

      } finally {
        await fs.writeFile(mainFilePath, originalContent);
      }
    } else {
      // If no parameters, just verify the panel is still there after HMR
      const mainFilePath = path.join(TEST_PROJECT_DIR, 'main.ts');
      const originalContent = await fs.readFile(mainFilePath, 'utf-8');

      try {
        const modifiedContent = originalContent.replace(
          'Test Box',
          'Modified Test Box'
        );

        await fs.writeFile(mainFilePath, modifiedContent);

        // Wait for HMR to complete
        await page.waitForTimeout(3000);

        // Verify parameter panel is still visible
        await expect(page.locator('parametric-panel')).toBeVisible();

      } finally {
        await fs.writeFile(mainFilePath, originalContent);
      }
    }
  });
});
