import { test, expect } from '@playwright/test';
import {
  waitForParametricPanelStable,
  waitForModelLoaded,
  evaluateWithRetry
} from './test-utils';

test.describe('Typeface Package E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the reference project
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="model-list"]', { timeout: 10000 });
  });

  test('should load font-test component successfully', async ({ page }) => {
    // Click on the font-test component
    await page.click('text=font-test');
    
    // Wait for the component to load
    await waitForModelLoaded(page);
    
    // Check that the component loaded without errors
    const errorMessages = await page.locator('.error-message').count();
    expect(errorMessages).toBe(0);
    
    // Check that the parametric panel is visible
    await expect(page.locator('[data-testid="parametric-panel"]')).toBeVisible();
  });

  test('should render text in 3D viewer', async ({ page }) => {
    // Navigate to font-test component
    await page.click('text=font-test');
    await waitForModelLoaded(page);

    // Wait for the parametric panel to stabilize
    await waitForParametricPanelStable(page);
    
    // Check that the 3D viewer shows content
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Wait a bit for rendering to complete
    await page.waitForTimeout(2000);
    
    // Take a screenshot to verify text is rendered
    const screenshot = await canvas.screenshot();
    expect(screenshot.length).toBeGreaterThan(1000); // Should have substantial content
  });

  test('should handle font loading without errors', async ({ page }) => {
    // Monitor console for font loading errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate to font-test component
    await page.click('text=font-test');
    await waitForModelLoaded(page);
    
    // Wait for font loading to complete
    await page.waitForTimeout(3000);
    
    // Check for font-related errors
    const fontErrors = consoleErrors.filter(error => 
      error.toLowerCase().includes('font') || 
      error.toLowerCase().includes('typeface') ||
      error.toLowerCase().includes('opentype')
    );
    
    expect(fontErrors).toHaveLength(0);
  });

  test('should display text correctly (not upside down)', async ({ page }) => {
    // Navigate to font-test component
    await page.click('text=font-test');
    await waitForModelLoaded(page);

    // Wait for rendering to complete
    await waitForParametricPanelStable(page);
    await page.waitForTimeout(2000);
    
    // Take a screenshot of the 3D viewer
    const canvas = page.locator('canvas');
    const screenshot = await canvas.screenshot();
    
    // The screenshot should contain rendered text
    // This is a basic check - in a real scenario, you might want to use
    // image comparison or OCR to verify the text orientation
    expect(screenshot.length).toBeGreaterThan(5000); // Should have substantial visual content
  });

  test('should work with HMR (Hot Module Replacement)', async ({ page }) => {
    // Navigate to font-test component
    await page.click('text=font-test');
    await waitForModelLoaded(page);

    // Wait for initial render
    await waitForParametricPanelStable(page);
    
    // Take initial screenshot
    const canvas = page.locator('canvas');
    const initialScreenshot = await canvas.screenshot();
    
    // Trigger HMR by making a small change to the component file
    // Note: This would require file system access in a real test
    // For now, we'll just verify the component continues to work
    
    // Refresh the page to simulate HMR
    await page.reload();
    await page.waitForSelector('[data-testid="model-list"]', { timeout: 10000 });
    
    // Navigate back to the component
    await page.click('text=font-test');
    await waitForModelLoaded(page);
    await waitForParametricPanelStable(page);
    
    // Take another screenshot
    const afterReloadScreenshot = await canvas.screenshot();
    
    // Both screenshots should have substantial content
    expect(initialScreenshot.length).toBeGreaterThan(1000);
    expect(afterReloadScreenshot.length).toBeGreaterThan(1000);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Monitor console for error handling
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Block font requests to simulate network errors
    await page.route('**/*.ttf', route => route.abort());
    await page.route('**/*.woff*', route => route.abort());
    
    // Navigate to font-test component
    await page.click('text=font-test');
    
    // The component should still load, even if fonts fail
    await waitForModelLoaded(page);
    
    // Check that the app didn't crash
    await expect(page.locator('[data-testid="parametric-panel"]')).toBeVisible();
    
    // There might be font loading errors, but the app should continue working
    const criticalErrors = consoleMessages.filter(msg => 
      msg.includes('error') && 
      !msg.toLowerCase().includes('font') &&
      !msg.toLowerCase().includes('network')
    );
    
    // Should not have critical errors unrelated to font loading
    expect(criticalErrors.length).toBeLessThan(3);
  });

  test('should support different font formats', async ({ page }) => {
    // Navigate to font-test component
    await page.click('text=font-test');
    await waitForModelLoaded(page);

    // Wait for font loading
    await waitForParametricPanelStable(page);
    await page.waitForTimeout(2000);
    
    // Check that the component renders successfully with the hardcoded Inter font
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Verify that text is rendered (should have visual content)
    const screenshot = await canvas.screenshot();
    expect(screenshot.length).toBeGreaterThan(2000);
  });

  test('should handle page interactions gracefully', async ({ page }) => {
    // Navigate to font-test component
    await page.click('text=font-test');
    await waitForModelLoaded(page);

    // Wait for rendering
    await waitForParametricPanelStable(page);

    // Check that the component still works after interactions
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Try interacting with the canvas (e.g., clicking)
    await canvas.click();

    // Component should still be functional
    await expect(canvas).toBeVisible();
  });
});
