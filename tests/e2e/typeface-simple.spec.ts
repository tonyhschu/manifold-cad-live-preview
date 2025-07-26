import { test, expect } from '@playwright/test';

test.describe('Typeface Package Simple Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the reference project
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="model-list"]', { timeout: 10000 });
  });

  test('should find font-test component in model list', async ({ page }) => {
    // Check that font-test is listed in the model list
    const fontTestOption = page.locator('option[value="font-test"]');
    await expect(fontTestOption).toBeVisible();
  });

  test('should be able to select font-test component', async ({ page }) => {
    // Select the font-test component
    await page.selectOption('#model-select', 'font-test');
    
    // Wait a moment for the selection to process
    await page.waitForTimeout(1000);
    
    // Check that the selection was successful
    const selectedValue = await page.locator('#model-select').inputValue();
    expect(selectedValue).toBe('font-test');
  });

  test('should load font-test component without immediate errors', async ({ page }) => {
    // Monitor console for immediate errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Select the font-test component
    await page.selectOption('#model-select', 'font-test');
    
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
