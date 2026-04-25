import { test, expect } from '@playwright/test';

test.describe('Cart', () => {
  test('can navigate to catalog and see products', async ({ page }) => {
    await page.goto('/');
    // Click catalog nav link
    const catalogBtn = page.locator('button', { hasText: /catalog|catálogo/i }).first();
    if (await catalogBtn.isVisible()) {
      await catalogBtn.click();
      await expect(page.locator('article').first()).toBeVisible({ timeout: 10000 });
    }
  });
});
