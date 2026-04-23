import React, { useState, useMemo } from 'react';
import { Product } from '../App';
import { ProductCard } from './ProductCard';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

type TabKey = 'bestSellers' | 'topRated' | 'newest';

interface FeaturedProductsProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  searchQuery: string;
  selectedCategory: string | null;
  onClearFilters: () => void;
  onViewAll: () => void;
  onProductClick?: (product: Product) => void;
  wishlist: string[];
  onToggleWishlist: (product: Product) => void;
  user?: any; // Add user prop
}

export function FeaturedProducts({
  products,
  onAddToCart,
  searchQuery,
  selectedCategory,
  onClearFilters,
  onViewAll,
  onProductClick,
  wishlist,
  onToggleWishlist,
  user
}: FeaturedProductsProps) {
  const { t } = useLanguage();
  const [displayCount, setDisplayCount] = useState(9);
  const [activeTab, setActiveTab] = useState<TabKey>('bestSellers');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'bestSellers', label: 'Más vendidos' },
    { key: 'topRated', label: 'Mejor valorados' },
    { key: 'newest', label: 'Novedades' },
  ];

  const sortedProducts = useMemo(() => {
    switch (activeTab) {
      case 'bestSellers':
        return [...products].sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0));
      case 'topRated':
        return [...products].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      case 'newest':
        return [...products].reverse();
      default:
        return products;
    }
  }, [products, activeTab]);

  const displayedProducts = sortedProducts.slice(0, displayCount);
  const hasMore = sortedProducts.length > displayCount;

  const showLoadMore = () => {
    setDisplayCount(prev => Math.min(prev + 9, sortedProducts.length));
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setDisplayCount(9);
  };

  const isFiltered = searchQuery || selectedCategory;

  const getCategoryTranslationKey = (category: string) => {
    switch (category) {
      case 'Smartphones':
        return 'categories.smartphones';
      case 'Laptops':
        return 'categories.laptops';
      case 'Headphones':
        return 'categories.headphones';
      case 'Gaming':
        return 'categories.gaming';
      default:
        return 'categories.smartphones';
    }
  };

  if (products.length === 0 && isFiltered) {
    return (
      <div className="bg-muted/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-muted-foreground mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.137 0-4.146.832-5.636 2.172M6.343 7.343A7.963 7.963 0 0112 9c2.137 0 4.146-.832 5.636-2.172" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">{t('featured.noProducts')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('featured.noProductsSubtitle')}
            </p>
            <button
              onClick={onClearFilters}
              className="bg-blue-500 dark:bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
            >
              {t('featured.clearFilters')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section aria-labelledby="featured-heading" className="bg-muted/50 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 id="featured-heading" className="text-2xl sm:text-3xl font-bold text-foreground mb-2 sm:mb-4">
            {isFiltered ? t('featured.searchResults') : t('featured.title')}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground px-4">
            {isFiltered
              ? `${t('featured.found')} ${products.length} ${products.length === 1 ? t('featured.product') : t('featured.products')}`
              : t('featured.subtitle')
            }
          </p>
          {isFiltered && (
            <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
              {searchQuery && (
                <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                  {t('general.search')}: &quot;{searchQuery}&quot;
                </div>
              )}
              {selectedCategory && (
                <div className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm">
                  {t('general.category')}: {t(getCategoryTranslationKey(selectedCategory))}
                </div>
              )}
              <button
                onClick={onClearFilters}
                className="text-muted-foreground hover:text-foreground text-sm underline"
              >
                {t('featured.clearFilters')}
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 pb-1 min-w-max sm:min-w-0 sm:flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`px-4 sm:px-5 py-2 min-h-[44px] rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-foreground hover:bg-muted'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="list"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12"
          >
            {displayedProducts.map((product, index) => (
              <motion.div
                key={product.id}
                role="listitem"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <ProductCard
                  product={product}
                  onAddToCart={onAddToCart}
                  onProductClick={onProductClick}
                  isInWishlist={wishlist.includes(product.id)}
                  onToggleWishlist={onToggleWishlist}
                  user={user}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="text-center space-y-3 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row items-center justify-center">
          {hasMore && (
            <button
              onClick={showLoadMore}
              className="bg-card border border-border text-foreground px-6 sm:px-8 py-3 rounded-lg hover:bg-accent transition-colors w-full sm:w-auto"
            >
              {t('featured.loadMore')}
            </button>
          )}
          <button
            onClick={onViewAll}
            className="bg-blue-500 dark:bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors w-full sm:w-auto"
          >
            {t('featured.viewAll')}
          </button>
        </div>
      </div>
    </section>
  );
}
