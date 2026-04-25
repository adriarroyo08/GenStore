import { test, expect } from '@playwright/test';

test.describe('Purchase Flow', () => {
  test.skip('full purchase: catalog → cart → checkout → payment', async ({ page }) => {
    // Requires authenticated user and test Stripe keys
    // This is a placeholder for when test credentials are available
  });
});
