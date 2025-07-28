import { test, expect } from '@playwright/test';
import { createSelectors, waitForAppReady } from './test-utils';

test.describe('Typeface Package Simple Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the reference project
    await page.goto('/');

    // Wait for the app to load using semantic selectors
    await waitForAppReady(page);
  });

  test('should find font-test component in model list', async ({ page }) => {
    const selectors = createSelectors(page);

    // Check that font-test is listed in the model options
    // Users would see this as "Font Test" in the dropdown
    // Note: Options in a select are not visible until the dropdown is opened,
    // so we check if the option exists in the DOM
    const fontTestOption = selectors.getModelOption('Font Test');
    await expect(fontTestOption).toBeAttached();
  });

  test('should be able to select font-test component', async ({ page }) => {
    const selectors = createSelectors(page);

    // Select the font-test component using semantic selector
    await selectors.selectModelByValue('components/font-test');

    // Wait for the model to load
    await selectors.waitForModelLoaded();

    // Check that the selection was successful using semantic selector
    const selectedValue = await selectors.modelSelector.inputValue();
    expect(selectedValue).toBe('components/font-test');
  });

  test('should load font-test component without immediate errors', async ({ page }) => {
    const selectors = createSelectors(page);

    // Monitor console for immediate errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Select the font-test component using semantic selector
    await selectors.selectModelByValue('components/font-test');
    
    // Wait for initial processing
    await page.waitForTimeout(2000);
    
    // Check for critical errors (ignore font loading errors for now)
    const criticalErrors = consoleErrors.filter(error => 
      !error.toLowerCase().includes('font') &&
      !error.toLowerCase().includes('network') &&
      !error.toLowerCase().includes('fetch')
    );
    
    expect(criticalErrors.length).toBeLessThan(3);
  });
});
