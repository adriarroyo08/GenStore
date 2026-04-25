import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('shows login page when clicking login button', async ({ page }) => {
    await page.goto('/');
    const loginBtn = page.locator('[aria-label="Iniciar sesión"]');
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
      await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
    }
  });

  test('shows error on invalid login', async ({ page }) => {
    await page.goto('/');
    const loginBtn = page.locator('[aria-label="Iniciar sesión"]');
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
      await page.fill('input[type="text"]', 'invalid@test.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      // Should show error within 10s
      await expect(page.locator('[class*="destructive"], [class*="error"], [role="alert"]')).toBeVisible({ timeout: 10000 });
    }
  });
});
