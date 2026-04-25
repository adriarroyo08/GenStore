# GenStore Visual Redesign + Full Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform GenStore into a premium Apple/Samsung-inspired e-commerce storefront with comprehensive test coverage (unit + E2E).

**Architecture:** CSS custom properties and Tailwind theme tokens drive the new palette. Components are rewritten with generous spacing, bold typography, and Framer Motion scroll-triggered animations. Testing uses Vitest + Testing Library for units and Playwright for E2E, with mocked Supabase/Stripe in unit tests.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 4, Framer Motion, Vitest, Testing Library, Playwright, Stripe.js, Supabase

---

## File Structure

### Modified files (visual redesign):
- `src/index.css` — Replace brand properties, body colors, typography scale
- `src/tailwind.css` — Update shadcn theme tokens to new palette
- `src/components/GenStoreLogo.tsx` — Update SVG gradients from violet to blue accent
- `src/components/Header.tsx` — Full redesign: clean nav, mobile Sheet menu
- `src/components/HeroSection.tsx` — Full redesign: minimal hero, no decorations
- `src/components/Footer.tsx` — Full redesign: dark bg, 4-col grid, no decorations
- `src/components/ProductCard.tsx` — Borderless cards, hover slide-up button
- `src/components/ProductCatalogPage.tsx` — Updated spacing, card grid
- `src/components/ProductDetailPage.tsx` — 2-col layout, vertical thumbnails
- `src/components/LoginForm.tsx` — Migrate inline styles to Tailwind
- `src/components/LoginPage.tsx` — Centered card layout
- `src/components/ShoppingCartPage.tsx` — Clean cards, circular quantity buttons
- `src/components/CheckoutPage.tsx` — Stepper with icons, animated transitions

### New files (tests):
- `src/__tests__/contexts/AuthContext.test.tsx`
- `src/__tests__/hooks/useCart.test.ts`
- `src/__tests__/hooks/useWishlist.test.ts`
- `src/__tests__/hooks/useOrders.test.ts`
- `src/__tests__/hooks/useSearch.test.ts`
- `src/__tests__/hooks/useReviews.test.ts`
- `src/__tests__/hooks/usePoints.test.ts`
- `src/__tests__/components/Header.test.tsx`
- `src/__tests__/components/Footer.test.tsx`
- `src/__tests__/components/LoginPage.test.tsx`
- `src/__tests__/components/SignupPage.test.tsx`
- `src/__tests__/components/ShoppingCartPage.test.tsx`
- `src/__tests__/components/CheckoutPage.test.tsx`
- `src/__tests__/components/ProductCard.test.tsx`
- `src/__tests__/components/ProductCatalogPage.test.tsx`
- `src/__tests__/components/ProductDetailPage.test.tsx`
- `src/__tests__/components/WishlistPage.test.tsx`
- `src/__tests__/components/OrdersPage.test.tsx`
- `src/__tests__/components/RewardsPage.test.tsx`
- `src/__tests__/components/ProductReviews.test.tsx`
- `src/__tests__/components/PageRouter.test.tsx`
- `server/tests/routes/auth.routes.test.ts`
- `server/tests/routes/cart.routes.test.ts`
- `server/tests/routes/orders.routes.test.ts`
- `server/tests/routes/payments.routes.test.ts`
- `e2e/playwright.config.ts`
- `e2e/purchase-flow.spec.ts`
- `e2e/auth.spec.ts`
- `e2e/cart.spec.ts`
- `e2e/search-filters.spec.ts`
- `e2e/error-paths.spec.ts`

---

## Task 1: Update CSS Foundation — New Palette and Typography

**Files:**
- Modify: `src/index.css`
- Modify: `src/tailwind.css`

- [ ] **Step 1: Replace brand custom properties in index.css**

Replace the `:root` block and body styles at the top of `src/index.css`:

```css
/* OLD (lines 7-13): */
:root {
  --gs-violet: #7c3aed;
  --gs-indigo: #6366f1;
  --gs-violet-light: #a78bfa;
  --gs-indigo-light: #818cf8;
  --gs-gradient: linear-gradient(135deg, var(--gs-violet), var(--gs-indigo));
}

/* NEW: */
:root {
  --gs-accent: #2563EB;
  --gs-accent-hover: #1D4ED8;
  --gs-accent-light: #3B82F6;
  --gs-gradient: linear-gradient(135deg, #0A0A0A, #1a1a2e);
}
```

- [ ] **Step 2: Update body background and text colors**

Replace body styles (lines 28-34):

```css
/* OLD: */
body {
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f0f9ff;
  color: #1e293b;
  line-height: 1.6;
  min-height: 100vh;
}

/* NEW: */
body {
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #FAFAFA;
  color: #0A0A0A;
  line-height: 1.6;
  min-height: 100vh;
}
```

- [ ] **Step 3: Update selection and scrollbar colors**

Replace selection (lines 37-40) and scrollbar colors (lines 43-65):

```css
::selection {
  background-color: rgba(37, 99, 235, 0.15);
  color: inherit;
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(37, 99, 235, 0.2); border-radius: 9999px; }
::-webkit-scrollbar-thumb:hover { background: rgba(37, 99, 235, 0.4); }

* { scrollbar-width: thin; scrollbar-color: rgba(37, 99, 235, 0.2) transparent; }
```

- [ ] **Step 4: Update typography scale to Apple-style bold headings**

Replace h1-h3 (lines 108-110):

```css
h1 { font-size: clamp(2rem, 5vw, 4rem); font-weight: 800; letter-spacing: -0.02em; }
h2 { font-size: clamp(1.5rem, 4vw, 2.5rem); font-weight: 700; letter-spacing: -0.02em; }
h3 { font-size: clamp(1.125rem, 3vw, 1.5rem); font-weight: 700; letter-spacing: -0.01em; }
```

- [ ] **Step 5: Update max-width from 1200px to 1400px for generous spacing**

Replace all occurrences of `max-width: 1200px` in index.css with `max-width: 1400px`.

- [ ] **Step 6: Update Tailwind theme tokens**

Replace the `html` block at the bottom of `src/tailwind.css` (line 37-39):

```css
/* OLD: */
html {
  font-size: 17px;
}

/* NEW: */
html {
  font-size: 16px;
}

.dark {
  --background: #0A0A0A;
  --foreground: #F5F5F5;
  --card: #141414;
  --card-foreground: #F5F5F5;
  --primary: #3B82F6;
  --primary-foreground: #FFFFFF;
  --secondary: #262626;
  --secondary-foreground: #A3A3A3;
  --muted: #262626;
  --muted-foreground: #A3A3A3;
  --accent: #1a1a2e;
  --accent-foreground: #F5F5F5;
  --destructive: #EF4444;
  --destructive-foreground: #FFFFFF;
  --border: #262626;
  --input: #262626;
  --ring: #3B82F6;
}

:root {
  --background: #FAFAFA;
  --foreground: #0A0A0A;
  --card: #FFFFFF;
  --card-foreground: #0A0A0A;
  --primary: #2563EB;
  --primary-foreground: #FFFFFF;
  --secondary: #F5F5F5;
  --secondary-foreground: #737373;
  --muted: #F5F5F5;
  --muted-foreground: #737373;
  --accent: #F0F4FF;
  --accent-foreground: #0A0A0A;
  --destructive: #DC2626;
  --destructive-foreground: #FFFFFF;
  --border: #E5E5E5;
  --input: #E5E5E5;
  --ring: #2563EB;
}
```

- [ ] **Step 7: Verify build compiles**

Run: `cd /home/ubuntu/GenStore && npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 8: Commit**

```bash
git add src/index.css src/tailwind.css
git commit -m "style: update CSS foundation to neutral premium palette"
```

---

## Task 2: Redesign GenStoreLogo

**Files:**
- Modify: `src/components/GenStoreLogo.tsx`

- [ ] **Step 1: Update SVG gradient colors from violet/indigo to blue accent**

In `GenStoreLogo.tsx`, replace the `<defs>` block (lines 31-43):

```tsx
<defs>
  <linearGradient id="gs-bag" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stopColor="#2563EB" />
    <stop offset="100%" stopColor="#1D4ED8" />
  </linearGradient>
  <linearGradient id="gs-accent" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stopColor="#3B82F6" />
    <stop offset="100%" stopColor="#2563EB" />
  </linearGradient>
  <linearGradient id="gs-shine" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
  </linearGradient>
</defs>
```

- [ ] **Step 2: Update text gradient to match new palette**

Replace the gradient text span (line 83-86):

```tsx
/* OLD: */
: 'bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent'

/* NEW: */
: 'bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent'
```

- [ ] **Step 3: Commit**

```bash
git add src/components/GenStoreLogo.tsx
git commit -m "style: update GenStoreLogo to blue accent palette"
```

---

## Task 3: Redesign Header — Clean Nav with Mobile Sheet

**Files:**
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Add Sheet import and mobile menu state**

Add to existing imports at the top of `Header.tsx`:

```tsx
import { Menu, Search, ShoppingBag, Heart, User as UserIcon, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
```

Add state after existing useState declarations (around line 86):

```tsx
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
```

- [ ] **Step 2: Rewrite the header JSX**

Replace the entire `return (...)` block (lines 132-513) with:

```tsx
return (
  <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200/50 dark:border-neutral-800/50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        {/* Logo */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
        >
          <GenStoreLogo size={32} />
          <span className="hidden sm:inline text-lg font-bold text-foreground">GenStore</span>
        </button>

        {/* Center Nav — Desktop */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Navegación principal">
          <button onClick={onHomeClick} className={`text-sm font-medium transition-colors ${currentPage === 'home' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {t('nav.home')}
          </button>
          <button onClick={onCatalogClick} className={`text-sm font-medium transition-colors ${currentPage === 'catalog' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {t('nav.catalog')}
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Search */}
          <div className="hidden sm:block w-48 lg:w-64">
            <SearchDropdown
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              products={products}
              onProductSelect={onProductSelect}
              onSearch={onSearch}
            />
          </div>

          {/* Theme Selector — Desktop */}
          <div className="hidden lg:block">
            <ThemeSelector />
          </div>

          {/* Wishlist */}
          {user && onWishlistClick && (
            <button
              onClick={onWishlistClick}
              aria-label="Lista de deseos"
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {wishlist.length > 99 ? '99+' : wishlist.length}
                </span>
              )}
            </button>
          )}

          {/* Cart */}
          <div className="relative" ref={cartRef}>
            <button
              onClick={() => onCartClick ? onCartClick() : setIsCartOpen(!isCartOpen)}
              aria-label={cartItemsCount > 0 ? `Carrito (${cartItemsCount})` : 'Carrito'}
              className={`relative p-2 text-muted-foreground hover:text-foreground transition-all ${cartBounce ? 'scale-110' : ''}`}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className={`absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center transition-all ${cartBounce ? 'scale-125 bg-green-500' : ''}`}>
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </span>
              )}
            </button>
          </div>

          {/* Account */}
          {user ? (
            <button
              onClick={() => onAccountClick?.()}
              aria-label="Mi cuenta"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {((user as any).username || user.name || user.email).charAt(0).toUpperCase()}
                </span>
              </div>
            </button>
          ) : (
            <button
              onClick={onLoginClick}
              aria-label="Iniciar sesión"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <UserIcon className="w-5 h-5" />
            </button>
          )}

          {/* Mobile Menu Trigger */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden p-2 text-muted-foreground hover:text-foreground" aria-label="Abrir menú">
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-background p-6">
              <nav className="flex flex-col gap-4 mt-8">
                <button onClick={() => { onHomeClick(); setIsMobileMenuOpen(false); }} className="text-left text-base font-medium py-2 border-b border-border">{t('nav.home')}</button>
                <button onClick={() => { onCatalogClick?.(); setIsMobileMenuOpen(false); }} className="text-left text-base font-medium py-2 border-b border-border">{t('nav.catalog')}</button>
                {user && (
                  <>
                    <button onClick={() => { onOrdersClick?.(); setIsMobileMenuOpen(false); }} className="text-left text-base font-medium py-2 border-b border-border">{t('nav.orders')}</button>
                    <button onClick={() => { onWishlistClick?.(); setIsMobileMenuOpen(false); }} className="text-left text-base font-medium py-2 border-b border-border">{t('wishlist.title')}</button>
                    <button onClick={() => { onRewardsClick?.(); setIsMobileMenuOpen(false); }} className="text-left text-base font-medium py-2 border-b border-border">{t('nav.rewards')}</button>
                    <button onClick={() => { onAccountClick?.(); setIsMobileMenuOpen(false); }} className="text-left text-base font-medium py-2 border-b border-border">{t('nav.account')}</button>
                    {isAdmin && (
                      <button onClick={() => { onProductDatabaseClick?.(); setIsMobileMenuOpen(false); }} className="text-left text-base font-medium py-2 border-b border-border">Admin</button>
                    )}
                  </>
                )}
                <div className="mt-4 flex items-center gap-3">
                  <LanguageSelector />
                  <CurrencySelector />
                  <ThemeSelector />
                </div>
                {user ? (
                  <button onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} className="mt-4 text-left text-destructive font-medium py-2">{t('auth.logout')}</button>
                ) : (
                  <button onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }} className="mt-4 bg-blue-600 text-white rounded-xl py-3 font-semibold text-center">{t('auth.login')}</button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  </header>
);
```

- [ ] **Step 3: Verify build compiles**

Run: `cd /home/ubuntu/GenStore && npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.tsx
git commit -m "style: redesign Header with clean nav and mobile Sheet menu"
```

---

## Task 4: Redesign HeroSection — Minimal Apple-style

**Files:**
- Modify: `src/components/HeroSection.tsx`

- [ ] **Step 1: Rewrite the entire HeroSection component**

Replace the full content of `src/components/HeroSection.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface HeroSectionProps {
  onShopNowClick: () => void;
  onLearnMoreClick?: () => void;
}

function AnimatedStat({ target, suffix, label, delay }: { target: number; suffix: string; label: string; delay: number }) {
  const isDecimal = target % 1 !== 0;
  const count = useMotionValue(0);
  const formatted = useTransform(count, (v) => isDecimal ? v.toFixed(1) : Math.round(v).toString());
  const [display, setDisplay] = useState(isDecimal ? '0.0' : '0');

  useEffect(() => {
    const controls = animate(count, target, { duration: 1.5, delay, ease: 'easeOut' });
    const unsubscribe = formatted.on('change', (v) => setDisplay(v));
    return () => { controls.stop(); unsubscribe(); };
  }, [count, formatted, target, delay]);

  return (
    <motion.div
      className="flex flex-col items-center px-6 sm:px-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1 + delay }}
    >
      <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
        {display}{suffix}
      </span>
      <span className="text-sm sm:text-base text-muted-foreground mt-1">{label}</span>
    </motion.div>
  );
}

export function HeroSection({ onShopNowClick, onLearnMoreClick }: HeroSectionProps) {
  const { t } = useLanguage();

  const stats = [
    { target: 500, suffix: '+', label: 'Productos' },
    { target: 10, suffix: 'K+', label: 'Clientes' },
    { target: 4.8, suffix: '★', label: 'Valoración' },
  ];

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden"
    >
      {/* Subtle gradient accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(37,99,235,0.08),transparent)]" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 text-center">
        {/* Headline */}
        <motion.h1
          id="hero-heading"
          className="text-foreground leading-[1.05] mb-6 sm:mb-8"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 800, letterSpacing: '-0.03em' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {t('hero.title')}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-10 sm:mb-14 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          {t('hero.subtitle')}
        </motion.p>

        {/* Single CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <button
            onClick={onShopNowClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 sm:px-14 py-4 sm:py-5 rounded-full text-base sm:text-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/25 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            {t('hero.shopNow')}
          </button>
        </motion.div>

        {/* Stats */}
        <div className="flex justify-center items-center gap-8 sm:gap-12 mt-16 sm:mt-24">
          {stats.map((stat, i) => (
            <AnimatedStat key={stat.label} target={stat.target} suffix={stat.suffix} label={stat.label} delay={i * 0.2} />
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2" aria-hidden="true">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
          <ChevronDown className="w-6 h-6 text-muted-foreground/40" />
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `cd /home/ubuntu/GenStore && npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/HeroSection.tsx
git commit -m "style: redesign HeroSection to minimal Apple-style"
```

---

## Task 5: Redesign Footer — Dark, Clean, No Decorations

**Files:**
- Modify: `src/components/Footer.tsx`

- [ ] **Step 1: Rewrite the Footer JSX**

Replace the entire `return (...)` block in Footer.tsx (lines 67-241) with a clean dark footer. Keep the existing imports, interface, destructured props, hooks, and icon definitions (lines 1-65). Replace only the return:

```tsx
return (
  <footer className="bg-neutral-950 text-neutral-300">
    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
        {/* Brand */}
        <div>
          <button onClick={onHomeClick} className="flex items-center gap-2.5 mb-5 hover:opacity-80 transition-opacity">
            <GenStoreLogo size={36} showText textVariant="light" textClassName="text-xl" />
          </button>
          <p className="text-neutral-400 text-sm leading-relaxed mb-6 max-w-xs">
            {t('footer.trustedPartner')}
          </p>
          <div className="flex gap-3">
            {[
              { href: 'https://instagram.com', label: 'Instagram', Icon: Instagram },
              { href: 'https://facebook.com', label: 'Facebook', Icon: Facebook },
              { href: 'https://x.com', label: 'Twitter', Icon: Twitter },
            ].map(({ href, label, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-blue-600 transition-all duration-200">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Shop */}
        <nav aria-label="Comprar">
          <h3 className="text-white text-sm font-semibold uppercase tracking-widest mb-5">{t('categories.title')}</h3>
          <div className="space-y-3">
            {['electrotherapy', 'massage', 'skincare', 'beauty-tech'].map((cat) => (
              <button key={cat} onClick={() => onCategoryClick?.(cat)}
                className="block text-sm text-neutral-400 hover:text-white transition-colors">
                {t(`categories.${cat === 'beauty-tech' ? 'beautyTech' : cat}`)}
              </button>
            ))}
          </div>
        </nav>

        {/* Support */}
        <nav aria-label="Soporte">
          <h3 className="text-white text-sm font-semibold uppercase tracking-widest mb-5">{t('footer.customerService')}</h3>
          <div className="space-y-3">
            {[
              { key: 'footer.shipping', onClick: onShippingInfoClick },
              { key: 'footer.returns', onClick: onReturnsClick },
              { key: 'general.support', onClick: onSupportClick },
              { key: 'general.faq', onClick: onFAQClick },
            ].map(({ key, onClick }) => (
              <button key={key} onClick={onClick} className="block text-sm text-neutral-400 hover:text-white transition-colors">
                {t(key)}
              </button>
            ))}
          </div>
        </nav>

        {/* Legal */}
        <nav aria-label="Legal">
          <h3 className="text-white text-sm font-semibold uppercase tracking-widest mb-5">Legal</h3>
          <div className="space-y-3">
            {[
              { key: 'general.about', onClick: onAboutClick },
              { key: 'nav.contact', onClick: onContactClick },
              { key: 'footer.privacy', onClick: onPrivacyClick },
              { key: 'footer.terms', onClick: onTermsClick },
            ].map(({ key, onClick }) => (
              <button key={key} onClick={onClick} className="block text-sm text-neutral-400 hover:text-white transition-colors">
                {t(key)}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Bottom */}
      <div className="border-t border-neutral-800 mt-14 pt-8 text-center text-sm text-neutral-500">
        © {currentYear} {businessInfo.razon_social || 'GenStore'}. {t('footer.allRightsReserved')}
        {businessInfo.cif && <> · CIF: {businessInfo.cif}</>}
      </div>
    </div>
  </footer>
);
```

- [ ] **Step 2: Remove unused icon imports**

Remove the icons that are no longer used from the import line (Zap, Heart, Sparkles, Waves, Info, Mail, HelpCircle, MessageCircle, Truck, RotateCcw, Shield, FileText). Keep Instagram, Facebook, Twitter. Remove the `categoryIcons`, `quickLinksIcons`, and `serviceIcons` objects.

- [ ] **Step 3: Verify build compiles**

Run: `cd /home/ubuntu/GenStore && npm run build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/components/Footer.tsx
git commit -m "style: redesign Footer to clean dark layout"
```

---

## Task 6: Redesign ProductCard — Borderless with Hover Slide-up

**Files:**
- Modify: `src/components/ProductCard.tsx`

- [ ] **Step 1: Update the article wrapper and image container**

Replace the article className (line 65):

```tsx
/* OLD: */
<article className={`group bg-card rounded-xl overflow-hidden border hover:shadow-md transition-all duration-300 flex flex-col h-full ${
  showRipple ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 scale-[1.02]' : 'border-border'
}`}>

/* NEW: */
<article className={`group bg-card rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-full hover:shadow-xl hover:shadow-black/5 ${
  showRipple ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/10 scale-[1.01]' : ''
}`}>
```

- [ ] **Step 2: Update image hover and add slide-up "Add" button**

Replace the image container div (lines 69-130). Change the image hover class from `hover:scale-105` to `group-hover:scale-105`. Add a slide-up add button inside the image container, after the out-of-stock overlay:

```tsx
{/* Slide-up add button on hover */}
{inStock && onAddToCart && (
  <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/60 to-transparent p-4 pt-8">
    <button
      onClick={handleAddToCart}
      disabled={cartState !== 'idle'}
      className="w-full bg-white text-black py-2.5 rounded-xl text-sm font-semibold hover:bg-neutral-100 transition-colors"
    >
      {cartState === 'loading' ? 'Añadiendo...' : cartState === 'done' ? '✓ Añadido' : t('product.addToCart')}
    </button>
  </div>
)}
```

- [ ] **Step 3: Update the discount badge styling**

Replace the discount badge (lines 87-90):

```tsx
/* OLD: */
<span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">

/* NEW: */
<span className="absolute top-3 left-3 text-red-600 dark:text-red-400 text-xs font-bold bg-red-50 dark:bg-red-950/50 px-2 py-1 rounded-lg">
```

- [ ] **Step 4: Update price section — remove the standalone add-to-cart button**

Remove the standalone add-to-cart button from the price section (lines 176-199) since we now have the slide-up button in the image. Keep only the price display.

- [ ] **Step 5: Verify build compiles**

Run: `cd /home/ubuntu/GenStore && npm run build 2>&1 | tail -5`

- [ ] **Step 6: Commit**

```bash
git add src/components/ProductCard.tsx
git commit -m "style: redesign ProductCard with borderless hover slide-up"
```

---

## Task 7: Redesign LoginPage — Centered Card Layout

**Files:**
- Modify: `src/components/LoginPage.tsx`
- Modify: `src/components/LoginForm.tsx`

- [ ] **Step 1: Rewrite LoginPage to centered card**

Replace the entire JSX return in LoginPage.tsx. Keep all existing state, hooks, and handlers. Replace only the return with a centered card layout — no split screen, no left decorative panel:

```tsx
return (
  <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('general.back')}
      </button>

      {/* Card */}
      <div className="bg-card rounded-2xl shadow-lg border border-border p-8 sm:p-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <GenStoreLogo size={48} showText textClassName="text-xl" />
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">{t('auth.loginTitle')}</h1>
        <p className="text-muted-foreground text-center text-sm mb-8">{t('auth.loginSubtitle')}</p>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium mb-1.5">{t('auth.emailOrUsername')}</label>
            <div className="relative">
              <input
                id="login-email"
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="w-full border border-input rounded-xl px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm"
                placeholder="email@ejemplo.com"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium mb-1.5">{t('auth.password')}</label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-input rounded-xl px-4 py-3 pr-12 bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div className="text-right">
            <button type="button" onClick={() => setShowForgotPassword(!showForgotPassword)} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 transition-colors">
              {t('auth.forgotPassword')}
            </button>
          </div>

          {/* Forgot password form */}
          {showForgotPassword && (
            <div className="bg-muted rounded-xl p-4 space-y-3">
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full border border-input rounded-xl px-4 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={t('auth.emailPlaceholder')}
              />
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isResettingPassword}
                className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isResettingPassword ? t('general.loading') : t('auth.sendResetLink')}
              </button>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-foreground text-background rounded-xl py-3.5 font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? t('general.loading') : t('auth.login')}
          </button>
        </form>

        {/* Signup link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {t('auth.noAccount')}{' '}
          <button onClick={onSignupClick} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            {t('auth.signupLink')}
          </button>
        </p>
      </div>
    </motion.div>
  </div>
);
```

- [ ] **Step 2: Migrate LoginForm from inline styles to Tailwind**

Replace all inline `style={{...}}` objects in `src/components/LoginForm.tsx` with Tailwind utility classes. This is a full rewrite — use the same centered card pattern as LoginPage with `rounded-2xl`, `border-input`, `rounded-xl` inputs, and remove the demo credentials display section.

- [ ] **Step 3: Verify build compiles**

Run: `cd /home/ubuntu/GenStore && npm run build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/components/LoginPage.tsx src/components/LoginForm.tsx
git commit -m "style: redesign LoginPage as centered card, migrate LoginForm to Tailwind"
```

---

## Task 8: Redesign ShoppingCartPage — Clean Cards, Circular Quantity Buttons

**Files:**
- Modify: `src/components/ShoppingCartPage.tsx`

- [ ] **Step 1: Update the page layout and card styling**

Read the current ShoppingCartPage.tsx and make these targeted changes:

1. Replace item cards border styling with shadow-based: remove `border` classes, add `bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow`
2. Replace quantity control buttons with circular ones: `w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors`
3. Make the order summary sidebar sticky: add `lg:sticky lg:top-24` to the summary container
4. Update the "Proceed to Checkout" button: `bg-foreground text-background rounded-xl py-3.5 font-semibold hover:opacity-90 transition-all`
5. Update empty state CTA: `bg-blue-600 text-white rounded-full px-8 py-3 font-semibold hover:bg-blue-700 transition-colors`

- [ ] **Step 2: Verify build compiles**

Run: `cd /home/ubuntu/GenStore && npm run build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add src/components/ShoppingCartPage.tsx
git commit -m "style: redesign ShoppingCartPage with clean cards and circular controls"
```

---

## Task 9: Redesign CheckoutPage — Stepper with Icons and Transitions

**Files:**
- Modify: `src/components/CheckoutPage.tsx`

- [ ] **Step 1: Add Framer Motion import and stepper icons**

Add to the imports:

```tsx
import { motion, AnimatePresence } from 'motion/react';
import { Truck, FileText, CreditCard, Check } from 'lucide-react';
```

- [ ] **Step 2: Add a CheckoutStepper component above the main export**

```tsx
function CheckoutStepper({ currentStep }: { currentStep: number }) {
  const steps = [
    { icon: Truck, label: 'Envío' },
    { icon: FileText, label: 'Facturación' },
    { icon: CreditCard, label: 'Pago' },
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10">
      {steps.map((step, i) => {
        const StepIcon = step.icon;
        const stepNum = i + 1;
        const isActive = currentStep === stepNum;
        const isCompleted = currentStep > stepNum;
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <div className={`hidden sm:block w-12 h-px ${isCompleted ? 'bg-blue-600' : 'bg-border'}`} />
            )}
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isCompleted ? 'bg-blue-600 text-white' :
                isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900' :
                'bg-muted text-muted-foreground'
              }`}>
                {isCompleted ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
              </div>
              <span className={`text-xs font-medium ${isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Integrate stepper and wrap step content in AnimatePresence**

Find where the step content renders and add:

1. Render `<CheckoutStepper currentStep={currentStep} />` above the step content
2. Wrap each step's content in:
```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={currentStep}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    {/* step content */}
  </motion.div>
</AnimatePresence>
```

- [ ] **Step 4: Verify build compiles**

Run: `cd /home/ubuntu/GenStore && npm run build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add src/components/CheckoutPage.tsx
git commit -m "style: add checkout stepper with icons and animated transitions"
```

---

## Task 10: Frontend Unit Tests — Auth (useAuth, AuthContext, LoginPage)

**Files:**
- Create: `src/__tests__/contexts/AuthContext.test.tsx`
- Create: `src/__tests__/components/LoginPage.test.tsx`

- [ ] **Step 1: Create AuthContext test**

```tsx
// src/__tests__/contexts/AuthContext.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuthContext } from '../../contexts/AuthContext';

// Mock supabase
vi.mock('../../lib/supabase', () => {
  const listeners: any[] = [];
  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn((cb: any) => {
          listeners.push(cb);
          return { data: { subscription: { unsubscribe: vi.fn() } } };
        }),
        signInWithPassword: vi.fn(),
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
    },
  };
});

vi.mock('../../lib/apiClient', () => ({
  apiClient: {
    get: vi.fn().mockRejectedValue(new Error('not authenticated')),
    post: vi.fn(),
  },
}));

function TestConsumer() {
  const { user, isAuthenticated, isLoading } = useAuthContext();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user">{user ? user.email : 'null'}</span>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starts in loading state then resolves to unauthenticated', async () => {
    render(
      <AuthProvider><TestConsumer /></AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('throws error when used outside provider', () => {
    expect(() => render(<TestConsumer />)).toThrow('useAuthContext must be used within AuthProvider');
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `cd /home/ubuntu/GenStore && npx vitest run src/__tests__/contexts/AuthContext.test.tsx --reporter=verbose 2>&1 | tail -15`
Expected: 2 tests pass

- [ ] **Step 3: Create LoginPage test**

```tsx
// src/__tests__/components/LoginPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock all context providers
vi.mock('../../contexts/AuthContext', () => ({
  useAuthContext: vi.fn().mockReturnValue({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, language: 'es' }),
}));

vi.mock('../../contexts/CurrencyContext', () => ({
  useCurrency: () => ({ formatPrice: (p: number) => `€${p}`, convertPrice: (p: number) => p }),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: { auth: { resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }) } },
}));

// We need to import after mocks
import { LoginPage } from '../../components/LoginPage';

describe('LoginPage', () => {
  const defaultProps = {
    onBack: vi.fn(),
    onSignupClick: vi.fn(),
    onForgotPassword: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders login form with email and password fields', () => {
    render(<LoginPage {...defaultProps} />);
    expect(screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/••••/)).toBeTruthy();
  });

  it('calls onBack when back button is clicked', async () => {
    render(<LoginPage {...defaultProps} />);
    const backButton = screen.getByText('general.back');
    await userEvent.click(backButton);
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('calls onSignupClick when signup link is clicked', async () => {
    render(<LoginPage {...defaultProps} />);
    const signupLink = screen.getByText('auth.signupLink');
    await userEvent.click(signupLink);
    expect(defaultProps.onSignupClick).toHaveBeenCalled();
  });

  it('toggles password visibility', async () => {
    render(<LoginPage {...defaultProps} />);
    const passwordInput = screen.getByPlaceholderText(/••••/);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByLabelText(/mostrar contraseña/i);
    await userEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
  });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/ubuntu/GenStore && npx vitest run src/__tests__/components/LoginPage.test.tsx --reporter=verbose 2>&1 | tail -15`
Expected: 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/contexts/ src/__tests__/components/LoginPage.test.tsx
git commit -m "test: add AuthContext and LoginPage unit tests"
```

---

## Task 11: Frontend Unit Tests — Cart (useCart, ShoppingCartPage, ProductCard)

**Files:**
- Create: `src/__tests__/hooks/useCart.test.ts`
- Create: `src/__tests__/components/ShoppingCartPage.test.tsx`
- Create: `src/__tests__/components/ProductCard.test.tsx`

- [ ] **Step 1: Create useCart test**

```tsx
// src/__tests__/hooks/useCart.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../../lib/apiClient', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue([]),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuthContext: vi.fn().mockReturnValue({ isAuthenticated: true }),
}));

import { useCart } from '../../hooks/useCart';
import { apiClient } from '../../lib/apiClient';

describe('useCart', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads empty cart on mount', async () => {
    const { result } = renderHook(() => useCart());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.cart).toEqual([]);
    expect(result.current.cartTotal).toBe(0);
    expect(result.current.cartCount).toBe(0);
  });

  it('maps server cart items to frontend format', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      {
        id: 'item-1',
        product_id: 'prod-1',
        cantidad: 2,
        opciones: { color: '#ff0000', colorName: 'Red' },
        product: {
          id: 'prod-1',
          nombre: 'Test Product',
          slug: 'test',
          precio: 29.99,
          imagenes: ['img.jpg'],
          stock: 10,
          marca: 'TestBrand',
          descripcion: 'Desc',
          categories: { nombre: 'Electronics' },
        },
      },
    ]);

    const { result } = renderHook(() => useCart());
    await waitFor(() => expect(result.current.cart.length).toBe(1));

    expect(result.current.cart[0].name).toBe('Test Product');
    expect(result.current.cart[0].price).toBe(29.99);
    expect(result.current.cart[0].quantity).toBe(2);
    expect(result.current.cartTotal).toBeCloseTo(59.98);
    expect(result.current.cartCount).toBe(2);
  });

  it('addToCart calls API and reloads', async () => {
    const { result } = renderHook(() => useCart());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addToCart('prod-1', '#ff0000', 'Red');
    });

    expect(apiClient.post).toHaveBeenCalledWith('/cart', {
      productId: 'prod-1',
      cantidad: 1,
      opciones: { color: '#ff0000', colorName: 'Red' },
    });
  });

  it('clearCart empties local state', async () => {
    const { result } = renderHook(() => useCart());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.clearCart();
    });

    expect(apiClient.delete).toHaveBeenCalledWith('/cart');
    expect(result.current.cart).toEqual([]);
  });
});
```

- [ ] **Step 2: Create ProductCard test**

```tsx
// src/__tests__/components/ProductCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../contexts/CurrencyContext', () => ({
  useCurrency: () => ({ formatPrice: (p: number) => `€${p.toFixed(2)}`, convertPrice: (p: number) => p }),
}));
vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, language: 'es' }),
}));
vi.mock('../../components/ProductComparator', () => ({
  useProductComparator: () => ({ addToCompare: vi.fn(), removeFromCompare: vi.fn(), isInCompare: () => false }),
}));
vi.mock('../../components/ProductQuickView', () => ({
  ProductQuickView: () => <div>QuickView</div>,
}));

import { ProductCard } from '../../components/ProductCard';
import type { Product } from '../../types/index';

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  description: 'Test description',
  price: 49.99,
  category: 'Electronics',
  rating: 4.5,
  reviews: 120,
  image: 'https://example.com/img.jpg',
  stock: 5,
};

describe('ProductCard', () => {
  it('renders product name and price', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeTruthy();
    expect(screen.getByText('€49.99')).toBeTruthy();
  });

  it('shows discount badge when on sale', () => {
    const saleProduct = { ...mockProduct, onSale: true, originalPrice: 99.99 };
    render(<ProductCard product={saleProduct} />);
    expect(screen.getByText('-50%')).toBeTruthy();
  });

  it('shows out of stock overlay when stock is 0', () => {
    render(<ProductCard product={{ ...mockProduct, stock: 0 }} />);
    expect(screen.getByText('Agotado')).toBeTruthy();
  });

  it('calls onProductClick when image is clicked', async () => {
    const onClick = vi.fn();
    render(<ProductCard product={mockProduct} onProductClick={onClick} />);
    const img = screen.getByAltText('Test Product');
    await userEvent.click(img);
    expect(onClick).toHaveBeenCalledWith(mockProduct);
  });

  it('shows wishlist button when user is logged in', () => {
    const onToggle = vi.fn();
    render(<ProductCard product={mockProduct} user={{ id: '1' }} onToggleWishlist={onToggle} />);
    expect(screen.getByLabelText(/favoritos/i)).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run all cart/product tests**

Run: `cd /home/ubuntu/GenStore && npx vitest run src/__tests__/hooks/useCart.test.ts src/__tests__/components/ProductCard.test.tsx --reporter=verbose 2>&1 | tail -20`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/hooks/useCart.test.ts src/__tests__/components/ProductCard.test.tsx
git commit -m "test: add useCart and ProductCard unit tests"
```

---

## Task 12: Frontend Unit Tests — Header, Footer, Wishlist, Orders, Reviews, Rewards

**Files:**
- Create: `src/__tests__/components/Header.test.tsx`
- Create: `src/__tests__/components/Footer.test.tsx`
- Create: `src/__tests__/hooks/useWishlist.test.ts`
- Create: `src/__tests__/hooks/useOrders.test.ts`
- Create: `src/__tests__/hooks/useReviews.test.ts`
- Create: `src/__tests__/hooks/usePoints.test.ts`

- [ ] **Step 1: Create Header test**

Test that: nav links render, cart badge shows count, mobile menu toggles, user avatar renders when logged in, login button renders when logged out. Mock all contexts (LanguageContext, CurrencyContext). Props: minimal required from HeaderProps.

- [ ] **Step 2: Create Footer test**

Test that: all nav sections render (categories, quick links, customer service, legal), social links render, copyright shows, onClick handlers fire.

- [ ] **Step 3: Create useWishlist test**

Mock apiClient. Test: loads wishlist on mount, toggleWishlist adds/removes, returns empty when unauthenticated.

- [ ] **Step 4: Create useOrders test**

Mock apiClient. Test: fetches orders, filters by status, cancels order.

- [ ] **Step 5: Create useReviews test**

Mock apiClient. Test: loads reviews, sorts by different criteria, submits review, checks eligibility.

- [ ] **Step 6: Create usePoints test**

Mock apiClient. Test: loads points balance, redeems reward, handles disabled system.

- [ ] **Step 7: Run all new tests**

Run: `cd /home/ubuntu/GenStore && npx vitest run src/__tests__/components/Header.test.tsx src/__tests__/components/Footer.test.tsx src/__tests__/hooks/useWishlist.test.ts src/__tests__/hooks/useOrders.test.ts src/__tests__/hooks/useReviews.test.ts src/__tests__/hooks/usePoints.test.ts --reporter=verbose 2>&1 | tail -20`
Expected: All tests pass

- [ ] **Step 8: Commit**

```bash
git add src/__tests__/components/Header.test.tsx src/__tests__/components/Footer.test.tsx src/__tests__/hooks/
git commit -m "test: add Header, Footer, wishlist, orders, reviews, points unit tests"
```

---

## Task 13: Frontend Unit Tests — Checkout, Catalog, Detail, Wishlist, Orders, Rewards Pages

**Files:**
- Create: `src/__tests__/components/CheckoutPage.test.tsx`
- Create: `src/__tests__/components/ProductCatalogPage.test.tsx`
- Create: `src/__tests__/components/WishlistPage.test.tsx`
- Create: `src/__tests__/components/OrdersPage.test.tsx`
- Create: `src/__tests__/components/RewardsPage.test.tsx`

- [ ] **Step 1: Create CheckoutPage test**

Test: renders step 1 by default, step navigation forward/back, address form fields required, stepper shows active/completed states. Mock AuthContext, LanguageContext, CurrencyContext, apiClient.

- [ ] **Step 2: Create ProductCatalogPage test**

Test: renders product grid, filter toggles category, sort dropdown changes order, empty state shows when no products match, grid/list view toggle works. Mock all contexts.

- [ ] **Step 3: Create WishlistPage test**

Test: renders wishlist items, remove from wishlist works, empty state shows, add-to-cart from wishlist fires handler.

- [ ] **Step 4: Create OrdersPage test**

Test: renders order list, status filter tabs work, empty state shows, order click navigates to detail.

- [ ] **Step 5: Create RewardsPage test**

Test: renders points balance, reward cards display, redeem button fires handler, insufficient points shows disabled state.

- [ ] **Step 6: Run all page tests**

Run: `cd /home/ubuntu/GenStore && npx vitest run src/__tests__/components/CheckoutPage.test.tsx src/__tests__/components/ProductCatalogPage.test.tsx src/__tests__/components/WishlistPage.test.tsx src/__tests__/components/OrdersPage.test.tsx src/__tests__/components/RewardsPage.test.tsx --reporter=verbose 2>&1 | tail -20`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add src/__tests__/components/
git commit -m "test: add Checkout, Catalog, Wishlist, Orders, Rewards page tests"
```

---

## Task 14: Backend Route Tests — Auth, Cart, Orders, Payments

**Files:**
- Create: `server/tests/routes/auth.routes.test.ts`
- Create: `server/tests/routes/cart.routes.test.ts`
- Create: `server/tests/routes/orders.routes.test.ts`
- Create: `server/tests/routes/payments.routes.test.ts`

- [ ] **Step 1: Create auth routes test**

Follow the pattern from `server/tests/services/paymentService.test.ts`. Mock `supabaseAdmin` and test:
- POST /auth/signup: creates user, returns success
- POST /auth/login: valid credentials return tokens, invalid return 401
- GET /auth/me: returns user profile when authenticated
- Admin middleware blocks non-admin users

- [ ] **Step 2: Create cart routes test**

Mock `supabaseAdmin`. Test:
- GET /cart: returns cart items for authenticated user
- POST /cart: adds item, validates stock
- PUT /cart/:id: updates quantity, ownership check
- DELETE /cart/:id: removes item, ownership check
- DELETE /cart: clears all items

- [ ] **Step 3: Create orders routes test**

Mock `supabaseAdmin`. Test:
- POST /orders: creates order from cart
- GET /orders: lists user orders
- GET /orders/:id: returns order detail
- POST /orders/:id/cancel: cancels pending order, rejects non-pending

- [ ] **Step 4: Create payments routes test**

Mock `stripe` and `supabaseAdmin`. Test:
- POST /payments/create-intent: creates payment intent, returns clientSecret
- POST /payments/confirm: confirms payment as fallback
- GET /payments/methods: lists saved payment methods

- [ ] **Step 5: Create routes directory and run tests**

```bash
mkdir -p /home/ubuntu/GenStore/server/tests/routes
```

Run: `cd /home/ubuntu/GenStore/server && npx vitest run tests/routes/ --reporter=verbose 2>&1 | tail -20`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add server/tests/routes/
git commit -m "test: add backend route tests for auth, cart, orders, payments"
```

---

## Task 15: E2E Tests — Playwright Setup and Core Flows

**Files:**
- Create: `e2e/playwright.config.ts`
- Create: `e2e/auth.spec.ts`
- Create: `e2e/purchase-flow.spec.ts`
- Create: `e2e/cart.spec.ts`
- Create: `e2e/search-filters.spec.ts`
- Create: `e2e/error-paths.spec.ts`

- [ ] **Step 1: Create Playwright config**

```ts
// e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'cd .. && npm run dev',
    port: 3000,
    reuseExistingServer: true,
    timeout: 60000,
  },
});
```

- [ ] **Step 2: Create auth E2E test**

```ts
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('shows login page', async ({ page }) => {
    await page.goto('/');
    await page.click('[aria-label="Iniciar sesión"]');
    await expect(page.locator('text=auth.loginTitle')).toBeVisible();
  });

  test('shows error on invalid login', async ({ page }) => {
    await page.goto('/');
    await page.click('[aria-label="Iniciar sesión"]');
    await page.fill('input[autocomplete="username"]', 'invalid@test.com');
    await page.fill('input[autocomplete="current-password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('[class*="destructive"]')).toBeVisible({ timeout: 10000 });
  });
});
```

- [ ] **Step 3: Create cart E2E test**

```ts
// e2e/cart.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Cart', () => {
  test('can navigate to catalog and see products', async ({ page }) => {
    await page.goto('/');
    await page.click('text=nav.catalog');
    await expect(page.locator('article').first()).toBeVisible({ timeout: 10000 });
  });
});
```

- [ ] **Step 4: Create purchase flow, search, and error path E2E skeletons**

Create the remaining E2E files with basic structure and `test.skip` for flows requiring authentication (since we don't have test credentials in CI):

```ts
// e2e/purchase-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Purchase Flow', () => {
  test.skip('full purchase: catalog → cart → checkout → payment', async ({ page }) => {
    // Requires authenticated user and test Stripe keys
  });
});
```

- [ ] **Step 5: Install Playwright browsers**

Run: `cd /home/ubuntu/GenStore && npx playwright install chromium 2>&1 | tail -5`

- [ ] **Step 6: Run E2E tests that don't require a running server**

Run: `cd /home/ubuntu/GenStore && npx playwright test e2e/ --reporter=list 2>&1 | tail -10`
Note: Tests requiring dev server will skip if server isn't running. The config handles this with `reuseExistingServer: true`.

- [ ] **Step 7: Commit**

```bash
git add e2e/
git commit -m "test: add Playwright E2E test structure and core auth/cart specs"
```

---

## Task 16: Run Full Test Suite and Fix Failures

**Files:**
- May modify any test or component file based on failures

- [ ] **Step 1: Run all frontend unit tests**

Run: `cd /home/ubuntu/GenStore && npx vitest run --reporter=verbose 2>&1 | tail -30`

- [ ] **Step 2: Fix any failing tests**

Analyze failures, fix mock issues or component changes that broke tests.

- [ ] **Step 3: Run all backend tests**

Run: `cd /home/ubuntu/GenStore/server && npx vitest run --reporter=verbose 2>&1 | tail -30`

- [ ] **Step 4: Fix any backend test failures**

- [ ] **Step 5: Run build to ensure no TypeScript errors**

Run: `cd /home/ubuntu/GenStore && npm run build 2>&1 | tail -10`

- [ ] **Step 6: Commit all fixes**

```bash
git add -A
git commit -m "fix: resolve test failures and build issues after redesign"
```

---

## Task 17: Final Visual Refinements — ProductCatalog, ProductDetail Spacing

**Files:**
- Modify: `src/components/ProductCatalogPage.tsx`
- Modify: `src/components/ProductDetailPage.tsx`

- [ ] **Step 1: Update ProductCatalogPage spacing**

Read ProductCatalogPage.tsx and make these changes:
1. Increase grid gap from `gap-4` to `gap-6 lg:gap-8`
2. Update page padding to `py-8 sm:py-12 lg:py-16`
3. Replace any `emerald` or `violet` color references with `blue-600` accent
4. Increase section headings to use the new bold typography

- [ ] **Step 2: Update ProductDetailPage layout**

Read ProductDetailPage.tsx and make these changes:
1. Update the 2-column layout gap to `gap-8 lg:gap-16`
2. Replace CTA button colors: "Añadir al Carrito" → `bg-blue-600 text-white`, "Comprar Ahora" → `bg-foreground text-background`
3. Replace any `emerald` color references with `blue-600` accent
4. Update trust badge styling to use neutral colors

- [ ] **Step 3: Verify build compiles**

Run: `cd /home/ubuntu/GenStore && npm run build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/components/ProductCatalogPage.tsx src/components/ProductDetailPage.tsx
git commit -m "style: update Catalog and Detail page spacing and accent colors"
```

---

## Task 18: Remove Old Color References — Consistency Pass

**Files:**
- Search and modify any files still using old palette

- [ ] **Step 1: Search for remaining violet/indigo/emerald references**

Run: `grep -rn 'violet\|indigo\|emerald' src/components/ --include='*.tsx' | grep -v node_modules | grep -v __tests__`

- [ ] **Step 2: Replace remaining old color references**

For each file found:
- Replace `violet-*` and `indigo-*` with `blue-*` equivalent
- Replace `emerald-*` with `blue-*` for accent uses (keep `green-*` for success states)
- Do NOT change files in Admin/, ui/, or diagnostic components (out of scope)

- [ ] **Step 3: Verify build compiles**

Run: `cd /home/ubuntu/GenStore && npm run build 2>&1 | tail -5`

- [ ] **Step 4: Run full test suite**

Run: `cd /home/ubuntu/GenStore && npx vitest run 2>&1 | tail -10`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "style: replace remaining violet/indigo/emerald with blue accent palette"
```
