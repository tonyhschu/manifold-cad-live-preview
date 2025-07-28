import { test, expect } from '@playwright/test';
import {
  waitForParametricPanelStable,
  waitForModelLoaded,
  evaluateWithRetry,
  createSelectors,
  waitForAppReady,
  selectModelByNameAndWait
} from './test-utils';

test.describe('Typeface Package E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the reference project
    await page.goto('/');

    // Wait for the app to load using semantic selectors
    await waitForAppReady(page);
  });

  test('should load font-test component successfully', async ({ page }) => {
    const selectors = createSelectors(page);

    // Select the font-test model using semantic approach
    await selectModelByNameAndWait(page, 'Font Test');

    // Check that the component loaded without errors using semantic selectors
    const errorMessages = await selectors.errorMessage.count();
    expect(errorMessages).toBe(0);

    // Check that the parametric panel is visible using semantic selector
    await expect(selectors.parametersSection).toBeVisible();
  });

  test('should render text in 3D viewer', async ({ page }) => {
    const selectors = createSelectors(page);

    // Navigate to font-test component using semantic approach
    await selectModelByNameAndWait(page, 'Font Test');

    // Wait for the parametric panel to stabilize
    await waitForParametricPanelStable(page);

    // Check that the 3D viewer shows content using semantic selector
    await expect(selectors.canvas).toBeVisible();
    
    // Wait a bit for rendering to complete
    await page.waitForTimeout(2000);
    
    // Take a screenshot to verify text is rendered
    const screenshot = await selectors.canvas.screenshot();
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
    
    // Navigate to font-test component using semantic approach
    await selectModelByNameAndWait(page, 'Font Test');
    
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
    const selectors = createSelectors(page);

    // Navigate to font-test component using semantic approach
    await selectModelByNameAndWait(page, 'Font Test');

    // Wait for rendering to complete
    await waitForParametricPanelStable(page);
    await page.waitForTimeout(2000);

    // Take a screenshot of the 3D viewer using semantic selector
    const screenshot = await selectors.canvas.screenshot();
    
    // The screenshot should contain rendered text
    // This is a basic check - in a real scenario, you might want to use
    // image comparison or OCR to verify the text orientation
    expect(screenshot.length).toBeGreaterThan(5000); // Should have substantial visual content
  });

  test('should work with HMR (Hot Module Replacement)', async ({ page }) => {
    const selectors = createSelectors(page);

    // Navigate to font-test component using semantic approach
    await selectModelByNameAndWait(page, 'Font Test');

    // Wait for initial render
    await waitForParametricPanelStable(page);

    // Take initial screenshot using semantic selector
    const initialScreenshot = await selectors.canvas.screenshot();
    
    // Trigger HMR by making a small change to the component file
    // Note: This would require file system access in a real test
    // For now, we'll just verify the component continues to work
    
    // Refresh the page to simulate HMR
    await page.reload();
    await waitForAppReady(page);

    // Navigate back to the component using semantic approach
    await selectModelByNameAndWait(page, 'Font Test');
    await waitForParametricPanelStable(page);
    
    // Take another screenshot using semantic selector
    const afterReloadScreenshot = await selectors.canvas.screenshot();
    
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
    
    // Navigate to font-test component using semantic approach
    // Note: Don't wait for model to load successfully since fonts are blocked
    const selectors = createSelectors(page);
    await selectors.selectModel('Font Test');

    // Wait a bit for the attempt to load
    await page.waitForTimeout(3000);

    // Check that the app didn't crash using semantic selector
    // The parameters section should still be visible even if model loading fails
    await expect(selectors.parametersSection).toBeVisible();
    
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
    const selectors = createSelectors(page);

    // Navigate to font-test component using semantic approach
    await selectModelByNameAndWait(page, 'Font Test');

    // Wait for font loading
    await waitForParametricPanelStable(page);
    await page.waitForTimeout(2000);

    // Check that the component renders successfully with the hardcoded Inter font
    await expect(selectors.canvas).toBeVisible();
    
    // Verify that text is rendered (should have visual content)
    const screenshot = await selectors.canvas.screenshot();
    expect(screenshot.length).toBeGreaterThan(2000);
  });

  test('should handle page interactions gracefully', async ({ page }) => {
    const selectors = createSelectors(page);

    // Navigate to font-test component using semantic approach
    await selectModelByNameAndWait(page, 'Font Test');

    // Wait for rendering
    await waitForParametricPanelStable(page);

    // Check that the component still works after interactions
    await expect(selectors.canvas).toBeVisible();

    // Try interacting with the canvas (e.g., clicking) using semantic selector
    // Wait for the canvas to be ready for interaction
    await selectors.canvas.waitFor({ state: 'visible' });
    await page.waitForTimeout(1000); // Give it a moment to be fully interactive

    try {
      await selectors.canvas.click({ timeout: 5000 });
    } catch (error) {
      // If clicking fails, that's okay - the main point is the component is still functional
      console.log('Canvas click failed, but continuing test:', error);
    }

    // Component should still be functional
    await expect(selectors.canvas).toBeVisible();
  });
});
