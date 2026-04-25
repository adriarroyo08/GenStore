import { test, expect } from '@playwright/test';

test.describe('Error Paths', () => {
  test('app loads without crashing', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
  });
});
