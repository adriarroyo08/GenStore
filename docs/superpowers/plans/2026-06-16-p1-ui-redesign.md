# P1: UI Redesign — Minimal Premium Experience

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform GenStore's visual layer into a minimal premium e-commerce experience (Apple/Zara aesthetic) with fluid page transitions, micro-interactions, and a mini-cart drawer — without touching business logic.

**Architecture:** Progressive enhancement over the existing functional frontend. New CSS design tokens, a PageTransition wrapper for AnimatePresence, component-level style updates, and two new components (MiniCartDrawer, FlyingItemAnimation). All changes are visual/interaction layer only.

**Tech Stack:** React 18, Tailwind CSS 4 (CSS variables), Framer Motion (motion/react), Lucide React, shadcn/ui, Embla Carousel

**Spec:** `docs/superpowers/specs/2026-06-16-p1-ui-redesign-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/components/PageTransition.tsx` | AnimatePresence wrapper for page route changes |
| `src/components/MiniCartDrawer.tsx` | Slide-in cart drawer from right side |
| `src/components/FlyingItemAnimation.tsx` | Animated item flying to cart icon on add |
| `src/components/QuickViewModal.tsx` | Quick product preview dialog/sheet |
| `src/components/ProductCardPremium.tsx` | Redesigned product card with hover effects |
| `src/components/HeroPremium.tsx` | New hero section with stagger animations |
| `src/hooks/useScrollDirection.ts` | Hook for hide-on-scroll header behavior |

### Modified Files

| File | Changes |
|------|---------|
| `src/tailwind.css` | New color tokens, typography, spacing for premium theme |
| `src/index.css` | Update brand colors, remove old blue accent |
| `src/components/PageRouter.tsx` | Wrap content in PageTransition |
| `src/components/Header.tsx` | Hide-on-scroll, search expand, glassmorphism, dark CTA styling |
| `src/components/Footer.tsx` | Align typography/spacing to premium tokens |
| `src/components/ProductCatalogPage.tsx` | Use ProductCardPremium, stagger animations, filter chips |
| `src/components/ProductDetailPage.tsx` | Sticky gallery, crossfade images, tab underline animation, premium CTA |
| `src/components/ShoppingCartPage.tsx` | Premium card styling, improved empty state, smoother remove animation |
| `src/components/CheckoutPage.tsx` | Premium stepper, rounded inputs, dark CTA |
| `src/App.tsx` | Add MiniCartDrawer + FlyingItemAnimation providers |

---

## Task 1: Design Tokens — CSS Variables

**Files:**
- Modify: `src/tailwind.css`
- Modify: `src/index.css`

- [ ] **Step 1: Update tailwind.css light theme tokens**

Replace the `:root` CSS variables in `src/tailwind.css` with premium palette:

```css
:root {
  --background: #FAFAFA;
  --foreground: #1A1A1A;
  --card: #FFFFFF;
  --card-foreground: #1A1A1A;
  --popover: #FFFFFF;
  --popover-foreground: #1A1A1A;
  --primary: #111111;
  --primary-foreground: #FFFFFF;
  --secondary: #F5F5F5;
  --secondary-foreground: #1A1A1A;
  --muted: #F5F5F5;
  --muted-foreground: #6B7280;
  --accent: #F5F5F5;
  --accent-foreground: #1A1A1A;
  --destructive: #DC2626;
  --destructive-foreground: #FFFFFF;
  --border: #E5E5E5;
  --input: #E5E5E5;
  --ring: #111111;
  --success: #16A34A;
  --radius: 0.75rem;
}
```

- [ ] **Step 2: Update dark theme tokens**

Replace `.dark` variables:

```css
.dark {
  --background: #0A0A0A;
  --foreground: #E5E5E5;
  --card: #141414;
  --card-foreground: #E5E5E5;
  --popover: #141414;
  --popover-foreground: #E5E5E5;
  --primary: #FFFFFF;
  --primary-foreground: #0A0A0A;
  --secondary: #1A1A1A;
  --secondary-foreground: #E5E5E5;
  --muted: #1A1A1A;
  --muted-foreground: #9CA3AF;
  --accent: #1A1A1A;
  --accent-foreground: #E5E5E5;
  --destructive: #DC2626;
  --destructive-foreground: #FFFFFF;
  --border: #262626;
  --input: #262626;
  --ring: #FFFFFF;
  --success: #16A34A;
}
```

- [ ] **Step 3: Update index.css brand colors**

In `src/index.css`, replace the blue accent variables (around lines 7-12):

```css
:root {
  --gs-accent: #111111;
  --gs-accent-hover: #333333;
  --gs-accent-light: #555555;
  --gs-gradient: linear-gradient(135deg, #FAFAFA, #F0F0F0);
}

.dark {
  --gs-accent: #FFFFFF;
  --gs-accent-hover: #E5E5E5;
  --gs-accent-light: #CCCCCC;
  --gs-gradient: linear-gradient(135deg, #0A0A0A, #141414);
}
```

Also update scrollbar colors from blue to neutral:

```css
::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 9999px;
}
.dark ::-webkit-scrollbar-thumb {
  background: #4B5563;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/tailwind.css src/index.css
git commit -m "style: update design tokens to minimal premium palette — black CTAs, neutral accents"
```

---

## Task 2: Page Transitions

**Files:**
- Create: `src/components/PageTransition.tsx`
- Modify: `src/components/PageRouter.tsx`

- [ ] **Step 1: Create PageTransition wrapper**

```tsx
// src/components/PageTransition.tsx
import { motion, AnimatePresence } from 'motion/react';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  pageKey: string;
  children: ReactNode;
}

export function PageTransition({ pageKey, children }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Integrate in PageRouter**

In `src/components/PageRouter.tsx`:

Add import at top:
```tsx
import { PageTransition } from './PageTransition';
```

Wrap the entire switch-case return. Find the main render function — it returns JSX based on `currentPage`. Wrap the outermost return content with:

```tsx
return (
  <PageTransition pageKey={currentPage}>
    {/* existing switch content */}
  </PageTransition>
);
```

The `pageKey` prop uses `currentPage` string so AnimatePresence detects route changes.

- [ ] **Step 3: Commit**

```bash
git add src/components/PageTransition.tsx src/components/PageRouter.tsx
git commit -m "feat: add page transition animations with AnimatePresence"
```

---

## Task 3: useScrollDirection Hook

**Files:**
- Create: `src/hooks/useScrollDirection.ts`

- [ ] **Step 1: Create the hook**

```typescript
// src/hooks/useScrollDirection.ts
import { useState, useEffect, useRef } from 'react';

export function useScrollDirection(threshold = 10) {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 20);

      if (Math.abs(currentY - lastScrollY.current) < threshold) return;

      setHidden(currentY > lastScrollY.current && currentY > 80);
      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return { hidden, scrolled };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useScrollDirection.ts
git commit -m "feat: add useScrollDirection hook for hide-on-scroll header"
```

---

## Task 4: Header Redesign

**Files:**
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Read the current Header.tsx and apply premium styling**

Key changes to make (read file first, then apply):

1. **Import useScrollDirection:**
```tsx
import { useScrollDirection } from '../hooks/useScrollDirection';
```

2. **Add hook call** inside the component:
```tsx
const { hidden, scrolled } = useScrollDirection();
```

3. **Update the outermost header element classes.** Replace the existing fixed header classes with:
```tsx
<header
  className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-300 ${
    hidden ? '-translate-y-full' : 'translate-y-0'
  } ${
    scrolled
      ? 'bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl shadow-sm'
      : 'bg-white dark:bg-neutral-950'
  } border-b border-border/50`}
>
```

4. **Cart badge styling:** Find the cart badge element (the one with item count). Update it from blue to dark accent:
```tsx
className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center"
```

5. **Nav link hover:** Find desktop nav links. Replace any blue hover with underline animation. For each link:
```tsx
className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
```

Add a pseudo-element style or an underline span that animates on hover. Simple approach — add after the link text:
```tsx
<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-foreground transition-all duration-300 group-hover:w-full" />
```
(Ensure the link wrapper has `group relative` class)

6. **Search button:** Keep existing SearchDropdown but update the trigger button styling to match — no blue background, just icon with hover.

7. **CTA buttons (Login):** If there's a login button, change from blue to:
```tsx
className="rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity"
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Header.tsx
git commit -m "style: premium header with hide-on-scroll, glassmorphism, dark accent CTAs"
```

---

## Task 5: Hero Section Redesign

**Files:**
- Create: `src/components/HeroPremium.tsx`
- Modify: `src/components/PageRouter.tsx`

- [ ] **Step 1: Create HeroPremium component**

```tsx
// src/components/HeroPremium.tsx
import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';

interface HeroPremiumProps {
  onShopClick: () => void;
}

export function HeroPremium({ onShopClick }: HeroPremiumProps) {
  const title = 'Discover Something Extraordinary';
  const words = title.split(' ');

  return (
    <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-background to-muted/30">
      <div className="relative z-10 text-center max-w-3xl mx-auto px-6">
        {/* Title with stagger */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
              className="inline-block mr-[0.25em]"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto"
        >
          Curated products for those who appreciate quality and design.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10"
        >
          <button
            onClick={onShopClick}
            className="rounded-full bg-primary text-primary-foreground px-10 py-4 text-base font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Explorar Coleccion
          </button>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-6 h-6 text-muted-foreground" />
        </motion.div>
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 2: Replace HeroSection usage in PageRouter**

In `src/components/PageRouter.tsx`, in the `'home'` case, replace `<HeroSection ... />` with:

```tsx
import { HeroPremium } from './HeroPremium';
// ...
<HeroPremium onShopClick={() => setCurrentPage('catalog')} />
```

Keep the rest of the homepage sections (TrustBadgesBar, OffersCarousel, CategoriesSection, FeaturedProducts, etc.) in place — they'll be updated in the next task.

- [ ] **Step 3: Commit**

```bash
git add src/components/HeroPremium.tsx src/components/PageRouter.tsx
git commit -m "feat: add premium hero section with stagger word animation and scroll indicator"
```

---

## Task 6: Homepage Sections Polish

**Files:**
- Modify: `src/components/CategoriesSection.tsx`
- Modify: `src/components/FeaturedProducts.tsx`
- Modify: `src/components/TrustBadgesBar.tsx` (or similar)
- Modify: `src/components/NewsletterSection.tsx`

- [ ] **Step 1: Polish CategoriesSection**

Read the current file. Key style changes:

1. Section wrapper: add generous padding `py-16 md:py-24`
2. Section title: `text-2xl md:text-3xl font-semibold tracking-tight text-center mb-12`
3. Category cards: `rounded-2xl overflow-hidden group cursor-pointer` with:
   - Image: `group-hover:scale-105 transition-transform duration-500`
   - Overlay: `bg-gradient-to-t from-black/60 to-transparent`
   - Name: `text-white font-medium text-lg`
4. Grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`
5. Add stagger animation on viewport entry using Framer Motion:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: '-50px' }}
  transition={{ duration: 0.5, delay: index * 0.1 }}
>
```

- [ ] **Step 2: Polish FeaturedProducts**

Read the current file. Key changes:

1. Section padding: `py-16 md:py-24`
2. Title: `text-2xl md:text-3xl font-semibold tracking-tight text-center mb-12`
3. If it uses a carousel, update arrow buttons to: `rounded-full border border-border bg-background hover:bg-muted w-10 h-10`
4. If it shows ProductCards, they'll be updated in Task 7

- [ ] **Step 3: Polish TrustBadgesBar**

Read the file. Update styling:

1. Container: `bg-muted/30 border-y border-border/50 py-8`
2. Layout: `flex flex-wrap justify-center gap-8 md:gap-16`
3. Each badge: icon (20px muted-foreground) + text (text-sm text-muted-foreground)
4. Dividers: Use `border-l border-border` between items on desktop (hidden on mobile)

- [ ] **Step 4: Polish NewsletterSection**

Read the file. Update to premium:

1. Section: `py-16 md:py-24 bg-muted/20`
2. Centered layout, max-w-md
3. Title: `text-2xl font-semibold tracking-tight text-center`
4. Input: `rounded-full border-border px-5 py-3`
5. Button: `rounded-full bg-primary text-primary-foreground px-6 py-3`
6. Layout: input and button inline on desktop, stacked on mobile

- [ ] **Step 5: Commit**

```bash
git add src/components/CategoriesSection.tsx src/components/FeaturedProducts.tsx src/components/TrustBadgesBar.tsx src/components/NewsletterSection.tsx
git commit -m "style: premium homepage sections — categories, featured, trust badges, newsletter"
```

---

## Task 7: ProductCard Redesign

**Files:**
- Modify: `src/components/ProductCard.tsx`

- [ ] **Step 1: Read and update ProductCard styling**

Key changes to the existing 211-line ProductCard.tsx:

1. **Image container:** Change from `aspect-square` to `aspect-[4/5]` for taller product images. Keep `rounded-2xl overflow-hidden`.

2. **Image hover:** Replace existing hover effects with:
```tsx
<img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
```

3. **Hover overlay:** Add a semi-transparent overlay that appears on hover with "Vista rapida" button:
```tsx
<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
  <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white text-foreground rounded-full px-5 py-2 text-sm font-medium shadow-lg hover:bg-gray-50">
    Vista rapida
  </button>
</div>
```

4. **Bottom add-to-cart button:** Update from blue to primary (black):
```tsx
className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
```

5. **Discount badge:** `rounded-full bg-destructive text-white text-xs font-bold px-2.5 py-1`

6. **Info section:**
   - Category: `text-xs uppercase tracking-wider text-muted-foreground`
   - Name: `text-sm font-medium text-foreground line-clamp-2`
   - Price: `text-base font-semibold text-foreground`
   - Original price: `text-sm text-muted-foreground line-through`

7. **Out-of-stock overlay:** `opacity-50` on the image + `rounded-full bg-muted text-muted-foreground text-xs px-3 py-1` badge

8. **Remove ripple/scale blue effects.** Replace with subtle shadow on hover:
```tsx
className="bg-card rounded-2xl overflow-hidden border border-border/50 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 group"
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ProductCard.tsx
git commit -m "style: premium ProductCard — taller aspect, hover zoom, dark CTAs, refined typography"
```

---

## Task 8: Quick View Modal

**Files:**
- Create: `src/components/QuickViewModal.tsx`
- Modify: `src/components/ProductCard.tsx`

- [ ] **Step 1: Create QuickViewModal**

```tsx
// src/components/QuickViewModal.tsx
import { X, ShoppingCart, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PriceDisplay } from './PriceDisplay';
import { VariantSelector } from './VariantSelector';
import { useState } from 'react';

interface QuickViewModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: any, variantId?: string) => void;
  onViewDetail: () => void;
  formatPrice: (n: number) => string;
}

export function QuickViewModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onViewDetail,
  formatPrice,
}: QuickViewModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  if (!product) return null;

  const displayPrecio = selectedVariant?.precio ?? product.price ?? product.precio;
  const displayStock = selectedVariant?.stock ?? product.stock;
  const mainImage = (selectedVariant?.imagenes?.length > 0
    ? selectedVariant.imagenes[0]
    : product.image || product.imagenes?.[0]) || '';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-3xl md:w-full z-50 bg-card rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid md:grid-cols-2 gap-0">
              {/* Image */}
              <div className="aspect-[4/5] bg-muted">
                {mainImage ? (
                  <img src={mainImage} alt={product.name || product.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Sin imagen
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-6 md:p-8 flex flex-col">
                {product.category && (
                  <span className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    {product.category}
                  </span>
                )}
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  {product.name || product.nombre}
                </h2>

                <p className="mt-3 text-2xl font-bold text-foreground">
                  {formatPrice(displayPrecio)}
                </p>

                {/* Variants */}
                {product.has_variants && product.variants?.length > 0 && (
                  <div className="mt-4">
                    <VariantSelector
                      variants={product.variants}
                      onVariantSelect={setSelectedVariant}
                    />
                  </div>
                )}

                <div className="mt-auto pt-6 space-y-3">
                  <button
                    onClick={() => {
                      onAddToCart(product, selectedVariant?.id);
                      onClose();
                    }}
                    disabled={displayStock <= 0 || (product.has_variants && !selectedVariant)}
                    className="w-full rounded-full bg-primary text-primary-foreground py-3.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {displayStock <= 0 ? 'Agotado' : 'Anadir al carrito'}
                  </button>
                  <button
                    onClick={() => { onClose(); onViewDetail(); }}
                    className="w-full rounded-full border border-border py-3.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Ver detalle completo
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Wire QuickViewModal in ProductCard**

In ProductCard.tsx, the "Vista rapida" button (added in Task 7) should open the QuickViewModal. Add state:

```tsx
const [quickViewOpen, setQuickViewOpen] = useState(false);
```

The "Vista rapida" overlay button onClick: `() => setQuickViewOpen(true)`

Render the modal at the end of the component:

```tsx
<QuickViewModal
  product={product}
  isOpen={quickViewOpen}
  onClose={() => setQuickViewOpen(false)}
  onAddToCart={onAddToCart}
  onViewDetail={onProductClick}
  formatPrice={formatPrice}
/>
```

Where `onAddToCart` and `onProductClick` come from existing props. Read the current ProductCard props to find the exact names.

- [ ] **Step 3: Commit**

```bash
git add src/components/QuickViewModal.tsx src/components/ProductCard.tsx
git commit -m "feat: add QuickViewModal for quick product preview from catalog"
```

---

## Task 9: Catalog Page Polish

**Files:**
- Modify: `src/components/ProductCatalogPage.tsx`

- [ ] **Step 1: Read and update catalog styling**

Key changes:

1. **Section padding:** Main container should have `py-8 md:py-12`

2. **Page title:** `text-2xl md:text-3xl font-semibold tracking-tight`

3. **Filter chips:** After the filter toolbar, show active filters as removable chips:
```tsx
<div className="flex flex-wrap gap-2 mb-6">
  {activeFilters.map(filter => (
    <span key={filter.key} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-sm text-foreground border border-border/50">
      {filter.label}
      <button onClick={() => removeFilter(filter.key)} className="hover:text-destructive">
        <X className="w-3 h-3" />
      </button>
    </span>
  ))}
</div>
```

3. **Product grid:** `grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6`

4. **"Load more" button:** Change to premium style:
```tsx
className="rounded-full border border-border px-8 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
```

5. **Progress indicator:** Add below load-more:
```tsx
<div className="mt-4 text-center">
  <p className="text-sm text-muted-foreground">Mostrando {displayed} de {total} productos</p>
  <div className="mt-2 h-0.5 w-32 mx-auto bg-border rounded-full overflow-hidden">
    <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${(displayed/total)*100}%` }} />
  </div>
</div>
```

6. **Stagger animation** on product grid items:
```tsx
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: (index % 12) * 0.04 }}
>
  <ProductCard ... />
</motion.div>
```

Import motion from 'motion/react' if not already imported.

7. **Filter sidebar (desktop):** Ensure border-r, muted background. Update any blue buttons/sliders to primary color.

- [ ] **Step 2: Commit**

```bash
git add src/components/ProductCatalogPage.tsx
git commit -m "style: premium catalog — stagger animations, filter chips, progress bar, refined grid"
```

---

## Task 10: Product Detail Page Redesign

**Files:**
- Modify: `src/components/ProductDetailPage.tsx`

- [ ] **Step 1: Read and apply premium changes**

Key changes to the 672-line file:

1. **Layout:** Change to 2-column on desktop with sticky gallery:
```tsx
<div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
  <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
    {/* Gallery - sticky */}
    <div className="lg:sticky lg:top-24 lg:self-start">
      {/* image gallery */}
    </div>
    {/* Info */}
    <div>{/* product info */}</div>
  </div>
</div>
```

2. **Image:** Change aspect-ratio to `aspect-[4/5]`, add `rounded-2xl`. Add crossfade transition between images:
```tsx
<motion.img
  key={currentImageUrl}
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.2 }}
  src={currentImageUrl}
  className="w-full h-full object-cover rounded-2xl"
/>
```

3. **Thumbnails:** `rounded-xl` with selected border:
```tsx
className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors cursor-pointer ${
  selected ? 'border-foreground' : 'border-transparent hover:border-border'
}`}
```

4. **Breadcrumb:** `text-xs text-muted-foreground` with `/` separators

5. **Product name:** `text-2xl md:text-3xl font-semibold tracking-tight`

6. **Price:** `text-xl md:text-2xl font-bold`. Sale: original tachado + red badge `rounded-full bg-destructive/10 text-destructive text-xs px-2 py-0.5`

7. **Add to Cart CTA:** Full-width `rounded-full bg-primary text-primary-foreground py-4 text-base font-medium`. Success state: green bg. Hover: `hover:opacity-90 transition-opacity`

8. **Quantity controls:** Minimalist with thin borders:
```tsx
<div className="flex items-center border border-border rounded-full">
  <button className="px-4 py-2 hover:bg-muted transition-colors rounded-l-full">-</button>
  <span className="px-4 py-2 text-sm font-medium">{quantity}</span>
  <button className="px-4 py-2 hover:bg-muted transition-colors rounded-r-full">+</button>
</div>
```

9. **Trust badges under CTA:** Three items in a row, icon 18px + text xs muted:
```tsx
<div className="flex justify-between mt-6 pt-6 border-t border-border/50">
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <Truck className="w-4 h-4" /> Envio 2-4 dias
  </div>
  ...
</div>
```

10. **Tabs:** Replace tab buttons with underline animation:
```tsx
<div className="relative flex gap-8 border-b border-border">
  {tabs.map(tab => (
    <button
      key={tab}
      onClick={() => setSelectedTab(tab)}
      className={`pb-3 text-sm font-medium transition-colors relative ${
        selectedTab === tab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {tab}
      {selectedTab === tab && (
        <motion.div
          layoutId="tab-underline"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
        />
      )}
    </button>
  ))}
</div>
```

11. **Mobile sticky CTA:** `backdrop-blur-xl bg-background/80 border-t border-border/50`

- [ ] **Step 2: Commit**

```bash
git add src/components/ProductDetailPage.tsx
git commit -m "style: premium product detail — sticky gallery, crossfade, tab underline, dark CTAs"
```

---

## Task 11: Mini-Cart Drawer

**Files:**
- Create: `src/components/MiniCartDrawer.tsx`
- Modify: `src/App.tsx` or `src/components/Header.tsx`

- [ ] **Step 1: Create MiniCartDrawer**

```tsx
// src/components/MiniCartDrawer.tsx
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, ArrowRight } from 'lucide-react';

interface MiniCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: any[];
  formatPrice: (n: number) => string;
  onViewCart: () => void;
  onCheckout: () => void;
}

export function MiniCartDrawer({
  isOpen,
  onClose,
  cart,
  formatPrice,
  onViewCart,
  onCheckout,
}: MiniCartDrawerProps) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-card shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold tracking-tight">
                Carrito ({cart.length})
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Tu carrito esta vacio</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      {item.variantAttributes && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {Object.values(item.variantAttributes).join(' / ')}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                        <span className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-border space-y-4">
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <button
                  onClick={() => { onClose(); onCheckout(); }}
                  className="w-full rounded-full bg-primary text-primary-foreground py-3.5 text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  Finalizar compra <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { onClose(); onViewCart(); }}
                  className="w-full rounded-full border border-border py-3.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Ver carrito
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Integrate MiniCartDrawer in App**

Read `src/App.tsx`. Add state and component:

1. Add state: `const [miniCartOpen, setMiniCartOpen] = useState(false);`
2. Create a function to open mini-cart: `const openMiniCart = () => setMiniCartOpen(true);`
3. Auto-open on add-to-cart: In the addToCart flow (find where it's called), add `setMiniCartOpen(true)` after successful add, with auto-close:
```tsx
const handleAddToCartWithDrawer = async (...args: any[]) => {
  await addToCart(...args);
  setMiniCartOpen(true);
  setTimeout(() => setMiniCartOpen(false), 3000);
};
```
4. Render `<MiniCartDrawer>` alongside the main content, passing cart data, formatPrice, navigation handlers.

5. Pass `openMiniCart` to Header so clicking the cart icon opens the drawer instead of navigating to cart page directly.

- [ ] **Step 3: Commit**

```bash
git add src/components/MiniCartDrawer.tsx src/App.tsx
git commit -m "feat: add MiniCartDrawer — slides from right on add-to-cart, auto-closes after 3s"
```

---

## Task 12: Cart Page Polish

**Files:**
- Modify: `src/components/ShoppingCartPage.tsx`

- [ ] **Step 1: Read and apply premium styling**

Key changes:

1. **Page title:** `text-2xl md:text-3xl font-semibold tracking-tight`

2. **Layout:** Ensure 2-column on desktop: items `lg:col-span-2` + summary `lg:col-span-1`, wrapped in `grid lg:grid-cols-3 gap-8`

3. **Cart items:** Each item card: `bg-card rounded-2xl p-4 border border-border/50`
   - Thumbnail: `w-20 h-24 rounded-xl overflow-hidden`
   - Name: `text-sm font-medium`
   - Variant attributes: `text-xs text-muted-foreground`
   - Quantity controls: Same rounded-full style as product detail
   - Remove button: `text-muted-foreground hover:text-destructive transition-colors` — just X icon, subtle

4. **Remove animation:** Already has fade left — keep it but ensure duration is 300ms

5. **Summary card:** `rounded-2xl border border-border/50 bg-card p-6 lg:sticky lg:top-24`
   - Subtotal, shipping, total with clean typography
   - Total: `text-lg font-bold`
   - CTA: `rounded-full bg-primary text-primary-foreground py-4 w-full text-sm font-medium`

6. **Empty state:**
```tsx
<div className="text-center py-24">
  <ShoppingBag className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
  <h2 className="text-xl font-semibold tracking-tight mb-2">Tu carrito esta vacio</h2>
  <p className="text-muted-foreground mb-8">Anade productos para empezar</p>
  <button onClick={onContinueShopping} className="rounded-full bg-primary text-primary-foreground px-8 py-3 text-sm font-medium">
    Explorar productos
  </button>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ShoppingCartPage.tsx
git commit -m "style: premium cart page — rounded cards, refined empty state, dark CTA, sticky summary"
```

---

## Task 13: Checkout Page Polish

**Files:**
- Modify: `src/components/CheckoutPage.tsx`

- [ ] **Step 1: Read and update stepper + forms**

Key changes:

1. **Stepper:** Update step circles and connecting line. Each step:
```tsx
<div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
  completed ? 'bg-primary text-primary-foreground border-primary' :
  active ? 'border-primary text-primary' :
  'border-border text-muted-foreground'
}`}>
  {completed ? <Check className="w-4 h-4" /> : stepNumber}
</div>
```
Connecting line: `h-0.5 flex-1 mx-2 rounded-full bg-border` with completed portion `bg-primary`

2. **Form inputs:** Add `rounded-xl` to all inputs. Ensure consistent:
```tsx
className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
```

3. **Section cards:** Each form section wrapped in `bg-card rounded-2xl p-6 border border-border/50`

4. **Pay button:** `rounded-full bg-primary text-primary-foreground py-4 w-full text-sm font-medium` with lock icon:
```tsx
<Lock className="w-4 h-4 mr-2" /> Pagar {formatPrice(total)}
```

5. **Order summary (sidebar):** `rounded-2xl border border-border/50 bg-card p-6 lg:sticky lg:top-24`
   - Item thumbnails: `w-12 h-12 rounded-lg`
   - Total: `text-lg font-bold border-t border-border pt-4 mt-4`

- [ ] **Step 2: Commit**

```bash
git add src/components/CheckoutPage.tsx
git commit -m "style: premium checkout — circle stepper, rounded inputs, dark pay CTA, clean summary"
```

---

## Task 14: Footer Polish

**Files:**
- Modify: `src/components/Footer.tsx`

- [ ] **Step 1: Read and update footer**

Key changes:

1. **Background:** `bg-foreground text-background` (inverted for premium dark footer in light mode) OR keep current dark approach `bg-neutral-950 text-neutral-300`

2. **Padding:** `py-16 md:py-20`

3. **Grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12`

4. **Column headings:** `text-sm font-semibold uppercase tracking-wider text-white mb-4`

5. **Links:** `text-sm text-neutral-400 hover:text-white transition-colors`

6. **Separator:** `border-t border-neutral-800 mt-12 pt-8`

7. **Copyright:** `text-xs text-neutral-500`

- [ ] **Step 2: Commit**

```bash
git add src/components/Footer.tsx
git commit -m "style: premium footer — refined typography, generous spacing, clean column layout"
```

---

## Task 15: Flying Item Animation

**Files:**
- Create: `src/components/FlyingItemAnimation.tsx`
- Modify: Integration in cart add flow

- [ ] **Step 1: Create FlyingItemAnimation component**

```tsx
// src/components/FlyingItemAnimation.tsx
import { motion, AnimatePresence } from 'motion/react';
import { useState, useCallback, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface FlyingItem {
  id: string;
  imageUrl: string;
  startX: number;
  startY: number;
}

interface FlyingItemContextType {
  triggerFly: (imageUrl: string, startX: number, startY: number) => void;
}

const FlyingItemContext = createContext<FlyingItemContextType>({ triggerFly: () => {} });

export function useFlyingItem() {
  return useContext(FlyingItemContext);
}

export function FlyingItemProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FlyingItem[]>([]);

  const triggerFly = useCallback((imageUrl: string, startX: number, startY: number) => {
    const id = `fly-${Date.now()}-${Math.random()}`;
    setItems(prev => [...prev, { id, imageUrl, startX, startY }]);

    // Auto-remove after animation
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id));
    }, 700);
  }, []);

  // Target: cart icon in header (approximate top-right position)
  const targetX = typeof window !== 'undefined' ? window.innerWidth - 80 : 0;
  const targetY = 28;

  return (
    <FlyingItemContext.Provider value={{ triggerFly }}>
      {children}
      <div className="fixed inset-0 z-[100] pointer-events-none">
        <AnimatePresence>
          {items.map(item => (
            <motion.div
              key={item.id}
              initial={{
                x: item.startX,
                y: item.startY,
                scale: 1,
                opacity: 1,
              }}
              animate={{
                x: targetX,
                y: targetY,
                scale: 0.15,
                opacity: 0.3,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.32, 0, 0.67, 0] }}
              className="absolute w-16 h-20 rounded-xl overflow-hidden shadow-lg"
            >
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </FlyingItemContext.Provider>
  );
}
```

- [ ] **Step 2: Wrap app with FlyingItemProvider**

In `src/App.tsx`, wrap the content with `<FlyingItemProvider>`:

```tsx
import { FlyingItemProvider } from './components/FlyingItemAnimation';

// Inside the provider stack:
<FlyingItemProvider>
  {/* existing content */}
</FlyingItemProvider>
```

- [ ] **Step 3: Trigger flying animation on add-to-cart**

In the add-to-cart handler (in App.tsx or useAppHandlers.ts), call `triggerFly` before adding:

```tsx
import { useFlyingItem } from './components/FlyingItemAnimation';

const { triggerFly } = useFlyingItem();

// In the add-to-cart handler, get the click event position or product image position:
// The simplest approach: trigger from a fixed approximate position
// Better: pass mouse event coordinates from the ProductCard/ProductDetailPage button click
```

In ProductCard.tsx and ProductDetailPage.tsx, when the add-to-cart button is clicked, capture the button's position:

```tsx
const handleAdd = (e: React.MouseEvent) => {
  const rect = e.currentTarget.getBoundingClientRect();
  triggerFly(product.image || '', rect.left, rect.top);
  onAddToCart(product, variantId);
};
```

This requires passing `triggerFly` through props or using the context directly in ProductCard/ProductDetailPage.

- [ ] **Step 4: Commit**

```bash
git add src/components/FlyingItemAnimation.tsx src/App.tsx src/components/ProductCard.tsx src/components/ProductDetailPage.tsx
git commit -m "feat: add flying item animation on add-to-cart with FlyingItemProvider context"
```

---

## Task 16: Build and Verify

- [ ] **Step 1: Build frontend**

```bash
cd /home/ubuntu/GenStore && npm run build
```

Expected: Clean build. Fix any TypeScript errors.

- [ ] **Step 2: Run tests**

```bash
cd /home/ubuntu/GenStore && npx vitest run 2>&1 | tail -30
```

Fix any test failures caused by component changes (likely mock updates for new props).

- [ ] **Step 3: Visual check list**

Verify each page renders correctly by reading the built output or running dev server. Key checks:
- Design tokens: black CTAs instead of blue, neutral scrollbar
- Page transitions: fade between pages
- Header: hides on scroll down, reappears on scroll up
- Hero: word stagger animation
- ProductCards: taller aspect, hover zoom, dark buttons
- Product detail: sticky gallery, crossfade, tab underline
- Mini-cart drawer: opens on add, auto-closes
- Cart/Checkout: rounded cards, dark CTAs

- [ ] **Step 4: Fix any issues and commit**

```bash
git add -A
git commit -m "fix: resolve build errors and polish premium UI integration"
```
