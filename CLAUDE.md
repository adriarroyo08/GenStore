# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

GenStore is a full-stack generic e-commerce platform. It includes a product catalog, shopping cart, Stripe payments, order management, wishlist, reviews, coupons, loyalty points/rewards, shipping integrations, and an admin panel.

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript 5 (strict)
- **Build tool**: Vite 5
- **Styling**: Tailwind CSS 4 + Radix UI + shadcn/ui components
- **Payments**: Stripe.js + @stripe/react-stripe-js (PaymentElement)
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend
- **Framework**: Hono 4 (Node.js ESM, @hono/node-server)
- **Database**: PostgreSQL via Supabase (supabaseAdmin client)
- **Auth**: Supabase Auth (JWT verified in middleware)
- **Payments**: Stripe SDK (PaymentIntents, webhooks)
- **Email**: Resend
- **Validation**: Zod
- **Invoices**: pdf-lib

### Testing
- Vitest 1 + @testing-library/react + @testing-library/jest-dom + jsdom

## How to Build and Run

```bash
# Frontend (terminal 1)
npm install
npm run dev              # Vite dev server at http://localhost:3000

# Backend (terminal 2)
cd server
npm install
npm run dev              # Hono server at http://localhost:3002 (tsx watch)
```

Both must be running for the app to work. The frontend calls the API at `/api/v1/*`.

### Production build
```bash
npm run build               # Frontend Vite build
cd server && npm run build  # Backend TypeScript compile
```

## Testing

```bash
npm run test              # Frontend: Vitest run once
npm run test:watch        # Frontend: Vitest watch mode

cd server && npm run test # Backend tests
```

## Environment Variables

Backend requires `server/.env` with:

```env
# Required
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
API_PORT=3002

# Optional
APP_URL=http://localhost:3000
RESEND_API_KEY, EMAIL_FROM
BUSINESS_NAME, BUSINESS_NIF, BUSINESS_ADDRESS, BUSINESS_EMAIL, BUSINESS_PHONE
SEUR_USER, SEUR_PASSWORD, SEUR_CONTRACT
CORREOS_EXPRESS_USER, CORREOS_EXPRESS_PASSWORD, CORREOS_EXPRESS_CLIENT_CODE
MRW_USER, MRW_PASSWORD, MRW_FRANCHISE_CODE
```

## Project Structure

```
src/                              # Frontend (React SPA)
├── App.tsx                       # Root component, global state, routing
├── types.ts                      # Domain types (Product, CartItem, User, CurrentPage)
├── components/
│   ├── PageRouter.tsx            # SPA page router (switch on currentPage)
│   ├── ProductCatalogPage.tsx    # Catalog with filters, sort, pagination
│   ├── ProductDetailPage.tsx     # Product detail with reviews, wishlist
│   ├── CheckoutPage.tsx          # Multi-step checkout
│   ├── CheckoutPaymentSection.tsx # Stripe PaymentElement integration
│   ├── Admin/                    # Admin panel components
│   └── ui/                       # shadcn/ui primitives
├── hooks/                        # Custom hooks (cart, wishlist, search, etc.)
├── contexts/                     # React contexts (Auth, Language, Currency, Theme)
├── lib/apiClient.ts              # HTTP client with auto Bearer token
├── data/translations/            # ES/EN translation strings
└── utils/                        # Utilities and helpers

server/                           # Backend API
├── src/
│   ├── index.ts                  # Hono app, basePath('/api/v1'), route registration
│   ├── config/                   # env, supabase, stripe clients
│   ├── middleware/               # auth, admin, cors, rateLimit, errorHandler
│   ├── routes/                   # API route handlers
│   ├── services/                 # Business logic layer
│   ├── db/migrations/            # 001-010 SQL (PostgreSQL)
│   └── types/                    # Backend types
```

## Database Schema

PostgreSQL via Supabase. Migrations in `server/src/db/migrations/` (001–010).

### Key DB patterns
- Products use Spanish column names: `nombre`, `precio`, `descripcion`, `en_oferta`, `imagenes` (array), `specs` (JSONB)
- Full-text search: `fts` tsvector column (Spanish config) on products
- The frontend hook `useTranslatedProducts` maps Spanish DB fields to English UI fields

## Conventions

- **DB fields**: Spanish (`nombre`, `precio`, `descripcion`, `activo`, `created_at`)
- **Frontend types**: English (`name`, `price`, `description`, `rating`)
- **Mapping**: Done in `useTranslatedProducts.ts` and `useReviews.ts`
- **UI text**: Spanish by default, with i18n support (ES/EN)
- **API base path**: `/api/v1`
- **Auth**: Supabase JWT tokens, verified in `authMiddleware`, admin checked in `adminMiddleware`
- **Payments**: Stripe PaymentElement (not legacy CardElement)
- **Components**: Use shadcn/ui primitives from `src/components/ui/`
- Follow existing code patterns and naming conventions
- Keep commits atomic and descriptive
