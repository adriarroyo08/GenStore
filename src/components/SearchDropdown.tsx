import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Product } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Star, Mic } from 'lucide-react';

interface SearchDropdownProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  products: Product[];
  onProductSelect: (product: Product) => void;
  onSearch: (query: string) => void;
}

// Helper functions for product images (reused from ProductCard)
function getProductImage(product: Product): string {
  // Use the product's image property if it's a valid URL or Data URL
  if (product.image && (product.image.startsWith('http') || product.image.startsWith('data:'))) {
    return product.image;
  }
  
  return getCategoryDefaultImage(product.category);
}

function getCategoryDefaultImage(category: string): string {
  switch (category) {
    case 'masaje-pistolas':
    case 'massage-guns':
      return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&auto=format';
    case 'depilacion-ipl':
    case 'ipl-devices':
      return 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop&auto=format';
    case 'freidoras-aire':
    case 'air-fryers':
      return 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop&auto=format';
    case 'cosmetica':
    case 'cosmetics':
      return 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop&auto=format';
    case 'productos':
    case 'products':
      return 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop&auto=format';
    case 'Smartphones':
      return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&auto=format';
    case 'Laptops':
      return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop&auto=format';
    case 'Gaming':
      return 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop&auto=format';
    case 'Headphones':
      return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&auto=format';
    default:
      return 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop&auto=format';
  }
}

export const SearchDropdown = React.forwardRef<HTMLDivElement, SearchDropdownProps>(({
  searchQuery,
  setSearchQuery,
  products,
  onProductSelect,
  onSearch
}, ref) => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check for SpeechRecognition support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsOpen(transcript.length > 0);
      setIsListening(false);
      onSearch(transcript.trim());
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [setSearchQuery, onSearch]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Filter products based on search query
  const filteredProducts = searchQuery.length > 0 
    ? products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5) // Limit to 5 results
    : [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsOpen(value.length > 0);
    setActiveIndex(-1);
  };

  const handleProductSelect = (product: Product) => {
    onProductSelect(product);
    setIsOpen(false);
    setSearchQuery(product.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredProducts.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredProducts.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleProductSelect(filteredProducts[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0) return; // handled by handleKeyDown
    setIsOpen(false);
    inputRef.current?.blur();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const showResults = isOpen && filteredProducts.length > 0;

  return (
    <div className="relative w-full" ref={ref || dropdownRef}>
      <form onSubmit={handleSubmit} role="search" className="relative">
        <div className={`relative bg-input-background rounded-full border-2 transition-colors ${
          isFocused ? 'border-emerald-500 bg-card' : 'border-border'
        }`}>
          <div className="flex items-center">
            <div className="pl-3 xxs:pl-4 sm:pl-5 pr-2 xxs:pr-3">
              <svg className="w-4 h-4 xxs:w-5 xxs:h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={showResults}
              aria-controls="search-results-list"
              aria-autocomplete="list"
              aria-activedescendant={activeIndex >= 0 ? `search-option-${filteredProducts[activeIndex]?.id}` : undefined}
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setIsFocused(true);
                if (searchQuery.length > 0) {
                  setIsOpen(true);
                }
              }}
              onBlur={() => setIsFocused(false)}
              placeholder={t('header.searchPlaceholder')}
              className="flex-1 bg-transparent px-1 xxs:px-2 py-2 xxs:py-3 text-sm xxs:text-base text-foreground placeholder-muted-foreground focus:outline-none"
            />
            {speechSupported && (
              <button
                type="button"
                onClick={toggleListening}
                aria-label={isListening ? 'Detener búsqueda por voz' : 'Búsqueda por voz'}
                className={`p-1.5 xxs:p-2 rounded-full transition-all flex-shrink-0 ${
                  isListening
                    ? 'text-red-500 ring-2 ring-red-400 animate-pulse bg-red-50 dark:bg-red-950/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Mic className="w-4 h-4 xxs:w-5 xxs:h-5" />
              </button>
            )}
            <button
              type="submit"
              aria-label={t('header.searchPlaceholder')}
              className="bg-emerald-500 text-white rounded-full p-2 xxs:p-3 hover:bg-emerald-600 transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4 xxs:w-5 xxs:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </form>

      {/* Live region for results count */}
      <div className="sr-only" aria-live="polite">
        {isOpen && searchQuery.length > 0 && (
          filteredProducts.length > 0
            ? `${filteredProducts.length} ${filteredProducts.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}`
            : 'No se encontraron resultados'
        )}
      </div>

      {/* Dropdown Results */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-lg border border-border z-50 max-h-80 xxs:max-h-96 overflow-y-auto modal-responsive">
          <div className="p-1 xxs:p-2">
            <div className="text-xs text-muted-foreground px-2 xxs:px-3 py-1 xxs:py-2 font-medium">
{t('search.results') || 'Search Results'}
            </div>
            <ul id="search-results-list" role="listbox">
            {filteredProducts.map((product, index) => (
              <li
                key={product.id}
                id={`search-option-${product.id}`}
                role="option"
                aria-selected={index === activeIndex}
              >
              <button
                onClick={() => handleProductSelect(product)}
                className={`w-full text-left p-2 xxs:p-3 hover:bg-accent/50 rounded-lg transition-all duration-200 flex items-center gap-2 xxs:gap-3 min-h-[44px] group hover:shadow-sm border border-transparent hover:border-accent ${index === activeIndex ? 'bg-accent/50 border-accent' : ''}`}
                tabIndex={-1}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted/20 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-border/50 group-hover:border-emerald-200 transition-all duration-200">
                  <ImageWithFallback
                    src={getProductImage(product)}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg transition-transform duration-200 group-hover:scale-105"
                    onError={(e) => {
                      // Fallback to a product icon if image fails
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,%3csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="rgb(16, 185, 129)"%3e%3cpath stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/%3e%3c/svg%3e';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate text-sm xxs:text-base">{product.name}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{product.description || product.category}</p>
                  <p className="text-xs xxs:text-sm text-muted-foreground truncate capitalize">{product.category.replace(/-/g, ' ')}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center justify-end gap-1">
                    {product.onSale && product.originalPrice && (
                      <span className="line-through text-muted-foreground text-xs">{formatPrice(product.originalPrice)}</span>
                    )}
                    <p className={`font-semibold text-sm xxs:text-base ${product.onSale && product.originalPrice ? 'text-red-500' : 'text-foreground'}`}>{formatPrice(product.price)}</p>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <div className="flex items-center gap-px">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < Math.round(product.rating) ? 'text-yellow-400' : 'text-muted-foreground/30'}`}
                          fill={i < Math.round(product.rating) ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{product.rating}</span>
                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${(product.stock ?? 0) > 0 ? 'bg-emerald-500' : 'bg-red-400'}`} />
                  </div>
                </div>
              </button>
              </li>
            ))}
            </ul>
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && searchQuery.length > 0 && filteredProducts.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-lg border border-border z-50 modal-responsive">
          <div className="p-3 xxs:p-4 text-center">
            <svg className="w-6 h-6 xxs:w-8 xxs:h-8 text-muted-foreground mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.137 0-4.146.832-5.636 2.172M6.343 7.343A7.963 7.963 0 0112 9c2.137 0 4.146-.832 5.636-2.172" />
            </svg>
            <p className="text-muted-foreground text-sm">{t('search.noResults') || 'No products found'}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('search.tryDifferentKeywords') || 'Try different keywords'}</p>
          </div>
        </div>
      )}
    </div>
  );
});

SearchDropdown.displayName = 'SearchDropdown';