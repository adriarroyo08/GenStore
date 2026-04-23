import React, { useState, useMemo } from 'react';
import { Product, CartItem } from '../types/index';
import { ProductCard } from './ProductCard';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { ChevronDown, SlidersHorizontal, X, Search, Star, LayoutGrid, List, Package, ShoppingCart, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Slider } from './ui/slider';
import { RecentlyViewed } from './RecentlyViewed';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { SkeletonProductGrid } from './SkeletonProductCard';

interface User {
  id: string;
  email: string;
  name?: string;
  access_token: string;
  profile?: any;
}

interface ProductCatalogPageProps {
  products: Product[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cartItemsCount: number;
  cart: CartItem[];
  updateQuantity: (productId: string, quantity: number, selectedColor?: string) => void;
  removeFromCart: (productId: string, selectedColor?: string) => void;
  cartTotal: number;
  user: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onHomeClick: () => void;
  onCartClick: () => void;
  onCheckoutClick?: () => void;
  onAccountClick?: () => void;
  onAddToCart: (product: Product, selectedColor?: string, selectedColorName?: string) => void;
  onProductSelect: (product: Product) => void;
  onSearch: (query: string) => void;
  selectedCategory: string | null;
  onBackToHome: () => void;
  onClearFilters: () => void;
  onCategoryChange: (category: string | null) => void;
  wishlist: string[];
  onToggleWishlist: (product: Product) => void;
}

type SortOption = 'featured' | 'price-low' | 'price-high' | 'rating' | 'newest' | 'most-discounted';

const SORT_STORAGE_KEY = 'genstore_catalog_sort';

export function ProductCatalogPage({
  products,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  onAddToCart,
  onProductSelect,
  onSearch,
  onClearFilters,
  wishlist,
  onToggleWishlist,
  user,
}: ProductCatalogPageProps) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [displayLimit, setDisplayLimit] = useState(12);
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    try {
      const saved = localStorage.getItem(SORT_STORAGE_KEY);
      if (saved && ['featured', 'price-low', 'price-high', 'rating', 'newest', 'most-discounted'].includes(saved)) {
        return saved as SortOption;
      }
    } catch { /* ignore */ }
    return 'featured';
  });
  const [activeCategory, setActiveCategory] = useState<string | null>(selectedCategory);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Sync when selectedCategory changes from outside (e.g. home page category click)
  React.useEffect(() => {
    setActiveCategory(selectedCategory);
  }, [selectedCategory]);

  // Categories — use slug for filtering, name for display
  const categories = useMemo(() => {
    const cats = new Map<string, { name: string; count: number }>();
    products.forEach((p: any) => {
      const slug = p.categorySlug || p.category || '';
      const name = p.category || slug;
      if (slug) {
        const existing = cats.get(slug);
        cats.set(slug, { name: existing?.name || name, count: (existing?.count ?? 0) + 1 });
      }
    });
    return Array.from(cats, ([slug, { name, count }]) => ({ slug, name, count }));
  }, [products]);

  // Global price bounds from all products
  const globalPriceMin = useMemo(
    () => (products.length ? Math.floor(Math.min(...products.map(p => p.price))) : 0),
    [products],
  );
  const globalPriceMax = useMemo(
    () => (products.length ? Math.ceil(Math.max(...products.map(p => p.price))) : 100),
    [products],
  );

  const [priceRange, setPriceRange] = useState<[number, number]>([globalPriceMin, globalPriceMax]);

  // Keep price range in sync when products (and therefore bounds) change
  React.useEffect(() => {
    setPriceRange([globalPriceMin, globalPriceMax]);
  }, [globalPriceMin, globalPriceMax]);

  const priceRangeActive = priceRange[0] !== globalPriceMin || priceRange[1] !== globalPriceMax;

  // Filter
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }

    if (activeCategory) {
      filtered = filtered.filter((p: any) => (p.categorySlug || p.category) === activeCategory);
    }

    if (priceRangeActive) {
      filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    }

    if (minRating !== null) {
      filtered = filtered.filter(p => p.rating >= minRating);
    }

    if (inStockOnly) {
      filtered = filtered.filter(p => (p.stock ?? 0) > 0);
    }

    return filtered;
  }, [products, searchQuery, activeCategory, priceRange, priceRangeActive, minRating, inStockOnly]);

  // Sort
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    switch (sortBy) {
      case 'price-low': return sorted.sort((a, b) => a.price - b.price);
      case 'price-high': return sorted.sort((a, b) => b.price - a.price);
      case 'rating': return sorted.sort((a, b) => b.rating - a.rating);
      case 'newest': return sorted.reverse();
      case 'most-discounted': return sorted.sort((a, b) => {
        const discA = a.onSale && a.originalPrice ? (1 - a.price / a.originalPrice) : 0;
        const discB = b.onSale && b.originalPrice ? (1 - b.price / b.originalPrice) : 0;
        return discB - discA;
      });
      default: return sorted;
    }
  }, [filteredProducts, sortBy]);

  const displayed = sortedProducts.slice(0, displayLimit);
  const hasActiveFilters = !!activeCategory || priceRangeActive || !!searchQuery || minRating !== null || inStockOnly;

  const activeFilterCount = [
    !!activeCategory,
    priceRangeActive,
    minRating !== null,
    inStockOnly,
  ].filter(Boolean).length;

  const clearAll = () => {
    setActiveCategory(null);
    setPriceRange([globalPriceMin, globalPriceMax]);
    setMinRating(null);
    setInStockOnly(false);
    setSearchQuery('');
    onClearFilters();
  };

  // Filter sidebar content (shared between desktop and mobile)
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-foreground">Categorias</h3>
        <div className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => {
                setActiveCategory(activeCategory === cat.slug ? null : cat.slug);
                setIsFiltersOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                activeCategory === cat.slug
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-xs text-muted-foreground">{cat.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price range slider */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-foreground">Precio</h3>
        <div className="px-1">
          <Slider
            min={globalPriceMin}
            max={globalPriceMax}
            step={1}
            value={priceRange}
            onValueChange={(v) => setPriceRange(v as [number, number])}
          />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{formatPrice(priceRange[0])}</span>
            <span>&mdash;</span>
            <span>{formatPrice(priceRange[1])}</span>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-foreground">Valoracion</h3>
        <div className="flex flex-wrap gap-2">
          {[4, 3, 2].map((stars) => (
            <button
              key={stars}
              onClick={() => setMinRating(minRating === stars ? null : stars)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                minRating === stars
                  ? 'bg-primary/10 text-primary'
                  : 'bg-card border border-border text-foreground hover:bg-muted'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              {stars}+
            </button>
          ))}
        </div>
      </div>

      {/* In stock only */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-foreground">Disponibilidad</h3>
        <div className="flex items-center gap-2">
          <Switch
            id="stock-filter"
            checked={inStockOnly}
            onCheckedChange={setInStockOnly}
          />
          <Label htmlFor="stock-filter" className="text-sm text-foreground cursor-pointer">
            Solo en stock
          </Label>
        </div>
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <Button variant="outline" onClick={clearAll} className="w-full">
          Limpiar filtros
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {searchQuery ? `Resultados para "${searchQuery}"` : 'Catalogo'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
          </p>
        </div>

        {/* Category pills (horizontal scroll) */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 pb-4 min-w-max sm:min-w-0 sm:flex-wrap">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !activeCategory
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-foreground hover:bg-muted'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.slug
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-foreground hover:bg-muted'
                }`}
              >
                {cat.name}
                <span className="ml-1.5 opacity-60">{cat.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar: filter button + sort */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            {/* Mobile filter button */}
            <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors relative">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtros
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>

            {/* Active filter badges */}
            {activeCategory && (
              <span
                className="flex flex-wrap items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium cursor-pointer hover:bg-primary/20"
                onClick={() => setActiveCategory(null)}
              >
                {categories.find(c => c.slug === activeCategory)?.name ?? activeCategory} <X className="w-3 h-3" />
              </span>
            )}
            {priceRangeActive && (
              <span
                className="flex flex-wrap items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium cursor-pointer hover:bg-primary/20"
                onClick={() => setPriceRange([globalPriceMin, globalPriceMax])}
              >
                {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])} <X className="w-3 h-3" />
              </span>
            )}
            {minRating !== null && (
              <span
                className="flex flex-wrap items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium cursor-pointer hover:bg-primary/20"
                onClick={() => setMinRating(null)}
              >
                {minRating}★+ <X className="w-3 h-3" />
              </span>
            )}
            {inStockOnly && (
              <span
                className="flex flex-wrap items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium cursor-pointer hover:bg-primary/20"
                onClick={() => setInStockOnly(false)}
              >
                En stock <X className="w-3 h-3" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="hidden sm:flex items-center border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}
                aria-label="Vista cuadrícula"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}
                aria-label="Vista lista"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => {
                  const val = e.target.value as SortOption;
                  setSortBy(val);
                  try { localStorage.setItem(SORT_STORAGE_KEY, val); } catch { /* ignore */ }
                }}
                className="appearance-none bg-card border border-border rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[140px]"
              >
                <option value="featured">Destacados</option>
                <option value="price-low">Precio: menor a mayor</option>
                <option value="price-high">Precio: mayor a menor</option>
                <option value="rating">Mejor valorados</option>
                <option value="newest">Mas recientes</option>
                <option value="most-discounted">Mayor descuento</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Main layout: sidebar (desktop) + grid */}
        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <FilterContent />
          </aside>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {products.length === 0 && !searchQuery && !activeCategory && !priceRangeActive && !minRating && !inStockOnly ? (
              <SkeletonProductGrid count={8} variant={viewMode} />
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <Search className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron productos</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {searchQuery
                    ? `No hay resultados para "${searchQuery}". Prueba con otros terminos.`
                    : 'Ajusta los filtros para ver productos.'}
                </p>
                <Button onClick={clearAll}>Limpiar filtros</Button>
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {displayed.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={onAddToCart}
                        onProductClick={onProductSelect}
                        isInWishlist={wishlist.includes(product.id)}
                        onToggleWishlist={onToggleWishlist}
                        user={user}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {displayed.map((product) => {
                      const imageUrl = product.image && (product.image.startsWith('http') || product.image.startsWith('data:'))
                        ? product.image : null;
                      const inStock = (product.stock ?? 0) > 0;
                      const hasDiscount = product.onSale && product.originalPrice && product.originalPrice > product.price;
                      return (
                        <article
                          key={product.id}
                          className="flex gap-4 bg-card rounded-xl border border-border hover:shadow-md transition-all p-3 sm:p-4 cursor-pointer"
                          onClick={() => onProductSelect(product)}
                        >
                          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-lg bg-muted/30 overflow-hidden flex-shrink-0">
                            {imageUrl ? (
                              <img src={imageUrl} alt={product.name} className="w-full h-full object-contain p-2" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-10 h-10 text-muted-foreground/40" />
                              </div>
                            )}
                            {hasDiscount && (
                              <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                -{Math.round((1 - product.price / product.originalPrice!) * 100)}%
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col gap-1">
                            {product.category && (
                              <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">{product.category}</span>
                            )}
                            <h3 className="text-sm sm:text-base font-semibold text-foreground line-clamp-1">{product.name}</h3>
                            {product.description && (
                              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">{product.description}</p>
                            )}
                            {product.rating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span className="text-xs text-muted-foreground">{product.rating} ({product.reviews})</span>
                              </div>
                            )}
                            <div className="flex-1" />
                            <div className="flex items-end justify-between gap-2">
                              <div className="flex items-baseline gap-2">
                                {hasDiscount && product.originalPrice && (
                                  <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                                )}
                                <span className={`text-lg font-bold ${hasDiscount ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                                  {formatPrice(product.price)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {user && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onToggleWishlist(product); }}
                                    className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                                    aria-label="Favoritos"
                                  >
                                    <Heart className={`w-4 h-4 ${wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                                  </button>
                                )}
                                {inStock && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                                  >
                                    <ShoppingCart className="w-4 h-4" />
                                    <span className="hidden sm:inline">Agregar</span>
                                  </button>
                                )}
                                {!inStock && (
                                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Agotado</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                {/* Load more */}
                {displayLimit < sortedProducts.length && (
                  <div className="text-center mt-10">
                    <p className="text-sm text-muted-foreground mb-3">
                      Mostrando {displayed.length} de {sortedProducts.length}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setDisplayLimit(prev => prev + 12)}
                    >
                      Cargar mas productos
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recently viewed */}
      <RecentlyViewed
        allProducts={products}
        onProductClick={onProductSelect}
      />
    </div>
  );
}
