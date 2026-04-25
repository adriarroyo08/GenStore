import { test, expect } from '@playwright/test';

test.describe('Search and Filters', () => {
  test('catalog page loads with products', async ({ page }) => {
    await page.goto('/');
    const catalogBtn = page.locator('button', { hasText: /catalog|catálogo/i }).first();
    if (await catalogBtn.isVisible()) {
      await catalogBtn.click();
      await expect(page.locator('article').first()).toBeVisible({ timeout: 10000 });
    }
  });
});
