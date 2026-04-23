import React from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { Product } from '../types';

interface PriceDisplayProps {
  product: Product;
  size?: 'sm' | 'base' | 'lg' | 'xl';
  showDiscount?: boolean;
  className?: string;
}

export function PriceDisplay({ 
  product, 
  size = 'base',
  showDiscount = true, 
  className = ''
}: PriceDisplayProps) {
  const { formatPrice, convertPrice } = useCurrency();
  
  // Check if product has discount
  const hasDiscount = product.onSale && product.originalPrice && product.originalPrice > product.price;
  
  // Convert prices for currency display
  const currentPrice = convertPrice(product.price);
  const originalPrice = product.originalPrice ? convertPrice(product.originalPrice) : null;
  
  // Size classes mapping
  const sizeClasses = {
    sm: {
      current: 'text-sm font-bold',
      original: 'text-xs',
      discount: 'text-xs px-1.5 py-0.5'
    },
    base: {
      current: 'text-lg font-bold',
      original: 'text-sm',
      discount: 'text-xs px-2 py-1'
    },
    lg: {
      current: 'text-xl font-bold',
      original: 'text-base',
      discount: 'text-sm px-2 py-1'
    },
    xl: {
      current: 'text-3xl sm:text-4xl font-bold',
      original: 'text-lg',
      discount: 'text-sm px-3 py-1'
    }
  };
  
  const currentSizeClasses = sizeClasses[size];
  
  if (hasDiscount && showDiscount && originalPrice) {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Current (discounted) price */}
          <span className={`${currentSizeClasses.current} text-foreground`}>
            {formatPrice(currentPrice)}
          </span>
          
          {/* Original price (crossed out) */}
          <span className={`${currentSizeClasses.original} text-muted-foreground line-through`}>
            {formatPrice(originalPrice)}
          </span>
          
          {/* Discount percentage badge */}
          {product.salePercentage && (
            <span className={`bg-red-500 text-white rounded ${currentSizeClasses.discount} font-semibold`}>
              -{product.salePercentage}%
            </span>
          )}
        </div>
      </div>
    );
  }
  
  // No discount - show regular price
  return (
    <span className={`${currentSizeClasses.current} text-foreground ${className}`}>
      {formatPrice(currentPrice)}
    </span>
  );
}