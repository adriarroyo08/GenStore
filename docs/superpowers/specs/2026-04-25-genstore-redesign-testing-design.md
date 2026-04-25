# GenStore — Visual Redesign + Full Testing Coverage

**Date:** 2026-04-25
**Status:** Approved
**Scope:** Visual redesign (Apple/Samsung-inspired), comprehensive testing (unit + E2E), targeted fixes

---

## 1. Context

GenStore is a full-stack e-commerce platform (React 18 + Hono + Supabase + Stripe). It has 2 commits, ~110 components, 9 frontend tests and 7 backend tests. The current visual identity uses a violet/indigo palette on light blue backgrounds with decorative orbs and grid overlays. The goal is to transform it into a premium, modern storefront targeting young consumers (18-35) inspired by Apple.com and Samsung.com aesthetics, while adding comprehensive test coverage.

## 2. Visual Identity

### 2.1 Color Palette

| Role | Light | Dark | Usage |
|------|-------|------|-------|
| Background | `#FAFAFA` | `#0A0A0A` | App background |
| Surface | `#FFFFFF` | `#141414` | Cards, modals, sheets |
| Text primary | `#0A0A0A` | `#F5F5F5` | Headlines, body |
| Text secondary | `#737373` | `#A3A3A3` | Subtexts, captions |
| Accent | `#2563EB` (blue-600) | `#3B82F6` (blue-500) | CTAs, links, active states |
| Accent hover | `#1D4ED8` (blue-700) | `#2563EB` (blue-600) | Hover states |
| Success | `#16A34A` | `#22C55E` | Confirmations, stock OK |
| Destructive | `#DC2626` | `#EF4444` | Errors, delete actions |
| Border | `#E5E5E5` | `#262626` | Dividers, card borders |

### 2.2 Typography

- **Font family:** Inter (already loaded)
- **Headlines:** weight 700-800, tracking -0.02em, sizes via clamp(2rem, 5vw, 4.5rem)
- **Body:** weight 400-500, 16-18px, line-height 1.6
- **Captions/labels:** weight 500, 12-14px, uppercase tracking 0.05em for labels

### 2.3 Design Principles

1. **Generous negative space** — double current padding/gap values
2. **Scroll-triggered animations** — Framer Motion fade-up, scale-in (useInView)
3. **Full-bleed hero imagery** — product as protagonist, viewport-height sections
4. **Subtle micro-interactions** — spring physics on buttons, hover lift on cards
5. **Minimal glass morphism** — only sticky header backdrop-blur, not overused
6. **Image-first** — large product imagery, minimal text overlay

## 3. Component Redesign Spec

### 3.1 Header
- Sticky with `backdrop-blur-md`, subtle bottom border (`border-neutral-200/50`)
- Left: Logo. Center: nav links (Inicio, Catalogo, Ofertas). Right: icons (Search, Wishlist, Cart, Account)
- Cart badge: numeric with bounce animation on add
- Mobile: hamburger icon → Sheet component (slide from right) with all nav items
- Remove current cluttered mobile nav buttons

### 3.2 Hero Section
- Full viewport height (`min-h-screen`)
- Large centered product image or gradient background
- Bold headline: clamp(2.5rem, 5vw, 4.5rem), weight 800
- Brief subtitle in text-secondary
- Single prominent CTA button ("Explorar Catalogo")
- Remove: floating orbs, grid overlay, diagonal accent lines
- Add: animated scroll indicator (chevron with pulse)

### 3.3 Product Card
- Aspect ratio 4:5 image container with `overflow-hidden`
- Hover: image `scale-105` with 300ms ease, "Anadir" button slides up from bottom
- Discount badge: small red text (no loud background)
- Rating: small gold stars + number
- Price: bold, original price strikethrough in gray
- No visible card border — relies on spacing and shadow on hover

### 3.4 Product Detail Page
- 2-column layout: gallery 60% left, info 40% right
- Gallery: vertical thumbnails on left side (Samsung style), main image with zoom
- CTAs stacked full-width: "Anadir al Carrito" (accent bg) + "Comprar Ahora" (black/dark bg)
- Clean underline tabs for description/specs/reviews
- Mobile: single column, sticky bottom CTA bar

### 3.5 Login/Signup
- Centered card layout (no split-screen)
- Card with subtle shadow (`shadow-lg`), rounded-2xl
- Inputs with floating labels, rounded-xl borders
- Password strength bar: 4 segments with semantic colors (red → amber → green)
- Migrate LoginForm from inline styles to Tailwind classes
- Remove demo credentials display

### 3.6 Shopping Cart
- Items as clean cards: large image (80x80), product info, circular quantity buttons
- Sticky order summary sidebar on desktop
- Slide-out animation on item removal (Framer Motion AnimatePresence)
- Empty state: centered icon + message + CTA to catalog

### 3.7 Checkout Page
- Horizontal stepper with icons: Envio (Truck) → Facturacion (FileText) → Pago (CreditCard)
- Active step: accent color + filled icon. Completed: checkmark. Upcoming: muted
- Animated transitions between steps (slide left/right with Framer Motion)
- Order summary always visible in right sidebar (desktop) or collapsible top section (mobile)
- Stripe PaymentElement: no functional changes, only container styling

### 3.8 Footer
- Background: `bg-neutral-950` (near black)
- 4-column grid: Company, Shop, Support, Legal
- Newsletter input: minimal inline form with accent submit button
- Social icons: monochromatic, hover to accent color
- No decorative elements (remove current blurred circles, pulse dots)

## 4. Testing Strategy

### 4.1 Frontend Unit Tests (Vitest + Testing Library)

**Auth:**
- `useAuth.test.ts` — login success/failure, signup, logout, session restore
- `AuthContext.test.tsx` — provider state management, user loading
- `LoginPage.test.tsx` — form submission, validation, error display, navigation
- `SignupPage.test.tsx` — form validation, submission, success/error states

**Cart:**
- `useCart.test.ts` — addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount
- `ShoppingCartPage.test.tsx` — render items, quantity controls, remove item, empty state, proceed to checkout
- `ProductCard.test.tsx` — add to cart button states (idle, loading, done)

**Checkout:**
- `CheckoutPage.test.tsx` — step navigation, address form validation, step transitions
- `CheckoutPaymentSection.test.tsx` — Stripe element rendering, error display, saved methods

**Orders:**
- `useOrders.test.ts` — fetch orders, order detail, cancel order
- `OrdersPage.test.tsx` — list rendering, empty state, pagination
- `OrderDetailPage.test.tsx` — order info display, status, cancel button

**Catalog:**
- `ProductCatalogPage.test.tsx` — filter, sort, search, grid/list toggle, pagination
- `ProductDetailPage.test.tsx` — image gallery, color selector, quantity, add to cart, tabs
- `useSearch.test.ts` — search query, debounce, results

**Wishlist:**
- `useWishlist.test.ts` — add/remove, fetch list
- `WishlistPage.test.tsx` — render items, remove, empty state

**Reviews:**
- `ProductReviews.test.tsx` — list reviews, submit form, validation
- `useReviews.test.ts` — fetch, create, eligibility check

**Coupons/Rewards:**
- `RewardsPage.test.tsx` — points display, redemption
- `usePoints.test.ts` — fetch points, redeem

**Shared UI:**
- `Header.test.tsx` — nav links, cart badge, mobile menu toggle, theme switch
- `Footer.test.tsx` — links render, newsletter form
- `PageRouter.test.tsx` — correct page renders for each currentPage value

### 4.2 Backend Unit Tests (Vitest)

- `auth.routes.test.ts` — login, signup, JWT validation, admin middleware
- `cart.routes.test.ts` — CRUD operations, stock validation, ownership checks
- `orders.routes.test.ts` — create order, list, cancel, state transitions
- `payments.routes.test.ts` — create-intent, confirm, webhook signature validation
- `coupons.routes.test.ts` — validate coupon, apply discount
- `points.routes.test.ts` — accumulate, redeem, balance check

### 4.3 E2E Tests (Playwright)

- **Full purchase flow:** Register → Browse catalog → View product → Add to cart → Checkout → Payment → Confirmation
- **Login/Logout:** Valid credentials login, session persistence, logout
- **Cart management:** Add multiple products, change quantities, remove items, clear cart
- **Search and filters:** Search by name, filter by category/price, sort results
- **Error paths:** Invalid login, out-of-stock product, payment failure

### 4.4 Test Patterns
- Mock Supabase and Stripe in unit tests (vi.mock)
- E2E tests run against dev server with seed data
- Structure: `describe` per feature → `it` per use case
- Frontend tests in `src/__tests__/` mirroring source structure
- Backend tests in `server/tests/` mirroring source structure

## 5. Targeted Fixes

| Issue | Fix |
|-------|-----|
| LoginForm inline styles | Rewrite with Tailwind classes |
| Mobile header cluttered | Replace with hamburger + Sheet |
| No checkout animations | Framer Motion step transitions |
| Weak error handling in cart/checkout | Sonner toast notifications for API errors |
| No loading skeletons in checkout | Add skeleton components during data fetch |

## 6. Out of Scope

- React Router migration (architectural change, separate cycle)
- Optimistic cart updates (state pattern change)
- Backend refactoring (routes, services, DB schema)
- Internationalization / translations
- Admin panel redesign
- Image optimization / CDN
- Address book improvements

## 7. CSS Architecture

- Update CSS custom properties in `index.css` to new palette
- Update Tailwind theme tokens in `tailwind.css` to match
- Keep shadcn/ui primitives, restyle via CSS variables
- All new styles via Tailwind utility classes (no new inline styles)
- Dark mode: maintain existing ThemeContext toggle, update color tokens

## 8. File Impact Summary

**Modified (visual):**
- `src/index.css` — new palette, spacing, typography
- `src/tailwind.css` — updated theme tokens
- `src/components/Header.tsx` — full redesign
- `src/components/HeroSection.tsx` — full redesign
- `src/components/Footer.tsx` — full redesign
- `src/components/ProductCard.tsx` — redesign hover/layout
- `src/components/ProductCatalogPage.tsx` — spacing, card layout
- `src/components/ProductDetailPage.tsx` — 2-col layout, gallery
- `src/components/LoginForm.tsx` — migrate to Tailwind
- `src/components/LoginPage.tsx` — centered card layout
- `src/components/ShoppingCartPage.tsx` — card items, quantity controls
- `src/components/CheckoutPage.tsx` — stepper, transitions
- `src/components/CheckoutPaymentSection.tsx` — container styling
- `src/components/GenStoreLogo.tsx` — update colors to new palette

**New (tests):**
- `src/__tests__/components/` — ~15 test files
- `src/__tests__/hooks/` — ~8 test files
- `src/__tests__/contexts/` — AuthContext test
- `server/tests/routes/` — ~5 test files
- `e2e/` — ~5 Playwright test files
- `e2e/playwright.config.ts`
