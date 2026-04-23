import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      SUPABASE_URL: 'https://placeholder.supabase.co',
      SUPABASE_ANON_KEY: 'placeholder-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'placeholder-service-role-key',
      API_PORT: '3001',
      NODE_ENV: 'test',
      FRONTEND_URL: 'http://localhost:5173',
      STRIPE_SECRET_KEY: 'sk_test_fake',
      STRIPE_WEBHOOK_SECRET: 'whsec_test_fake',
      RESEND_API_KEY: 're_test_fake',
      EMAIL_FROM: 'Test <test@test.com>',
      STOCK_ALERT_ADMIN_EMAIL: 'admin@test.com',
      STOCK_ALERT_CRON_SECRET: 'test-cron-secret',
      BUSINESS_NAME: 'Test Business S.L.',
      BUSINESS_NIF: 'B12345678',
      BUSINESS_ADDRESS: 'Calle Test 1, 28001 Madrid',
      BUSINESS_EMAIL: 'test@test.com',
      BUSINESS_PHONE: '+34 600 000 000',
      SHIPPING_SYNC_CRON_SECRET: 'test-shipping-secret',
    },
  },
});
