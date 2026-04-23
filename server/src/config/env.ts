import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env from project root (../../.. from dist/config/)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
// Also try server/.env as fallback
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Validate at startup — fail fast if misconfigured
const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  API_PORT: z.coerce.number().default(3002),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_ENV: z.enum(['development', 'production']).default('development'),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),

  // App
  APP_URL: z.string().default('http://localhost:3000'),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('GenStore <noreply@genstore.com>'),
  STOCK_ALERT_ADMIN_EMAIL: z.string().optional(),
  STOCK_ALERT_CRON_SECRET: z.string().optional(),

  // Business info (for invoices)
  BUSINESS_NAME: z.string().default('GenStore S.L.'),
  BUSINESS_NIF: z.string().default('B00000000'),
  BUSINESS_ADDRESS: z.string().default(''),
  BUSINESS_EMAIL: z.string().default(''),
  BUSINESS_PHONE: z.string().default(''),

  // Shipping carriers (all optional)
  SEUR_USER: z.string().optional(),
  SEUR_PASSWORD: z.string().optional(),
  SEUR_CONTRACT: z.string().optional(),
  SEUR_API_URL: z.string().optional(),
  CORREOS_EXPRESS_USER: z.string().optional(),
  CORREOS_EXPRESS_PASSWORD: z.string().optional(),
  CORREOS_EXPRESS_CLIENT_CODE: z.string().optional(),
  MRW_USER: z.string().optional(),
  MRW_PASSWORD: z.string().optional(),
  MRW_FRANCHISE_CODE: z.string().optional(),
  MRW_API_URL: z.string().optional(),
  SHIPPING_SYNC_CRON_SECRET: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
});

export const env = envSchema.parse(process.env);
