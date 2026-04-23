import React, { useMemo } from 'react';
import svgPaths from "../imports/svg-vnih5l184e";
import { Product } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";

interface ProductCarouselProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onProductClick?: (product: Product) => void;
}

function ProductCard({ product, onAddToCart, onProductClick }: { 
  product: Product; 
  onAddToCart: (product: Product) => void;
  onProductClick?: (product: Product) => void;
}) {
  const { t } = useLanguage();

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <div key={i} className="relative shrink-0 size-4">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
          <g>
            <path d="M16 16H0V0H16V16Z" stroke="var(--stroke-0, #FCD34D)" />
            <path
              d="M8.2417 1.3125C8.26535 1.26833 8.30095 1.23152 8.34488 1.20635C8.38882 1.18118 8.43915 1.16855 8.49009 1.16855C8.54102 1.16855 8.59135 1.18118 8.63529 1.20635C8.67923 1.23152 8.71483 1.26833 8.73848 1.3125L9.92683 4.13558C9.99602 4.28439 10.1059 4.41227 10.2449 4.50497C10.3839 4.59767 10.5463 4.65201 10.7142 4.66242L13.7717 5.03242C13.8287 5.03936 13.8821 5.06161 13.9256 5.09644C13.9691 5.13127 14.0009 5.17716 14.0172 5.22855C14.0335 5.27994 14.0336 5.33483 14.0174 5.38625C14.0013 5.43768 13.9696 5.48366 13.9262 5.51858L11.5692 7.76242C11.4565 7.87112 11.3782 8.00983 11.3422 8.16183C11.3061 8.31383 11.3137 8.47309 11.364 8.62083L12.07 11.6333C12.0815 11.6893 12.0773 11.7474 12.0579 11.8012C12.0384 11.855 12.0047 11.9024 11.96 11.9383C11.9153 11.9742 11.8616 11.9972 11.8048 12.0049C11.748 12.0126 11.6903 12.0048 11.6375 11.9825L8.82017 10.485C8.68383 10.4122 8.53113 10.3738 8.37617 10.3738C8.22121 10.3738 8.06851 10.4122 7.93217 10.485L5.115 11.9825C5.06225 12.0047 5.00456 12.0124 4.94774 12.0047C4.89093 11.997 4.83725 11.974 4.79258 11.9381C4.74792 11.9022 4.71428 11.8548 4.69488 11.801C4.67547 11.7472 4.67121 11.6891 4.6825 11.6333L5.38817 8.62167C5.43828 8.47385 5.44591 8.31447 5.40979 8.16238C5.37367 8.01029 5.29528 7.87147 5.1825 7.76242L2.8255 5.5195C2.78164 5.48464 2.7495 5.43856 2.73307 5.38699C2.71664 5.33541 2.71662 5.28036 2.73301 5.22877C2.74941 5.17717 2.78148 5.13104 2.8251 5.09611C2.86873 5.06118 2.92199 5.03897 2.979 5.03208L6.03567 4.66242C6.20361 4.65213 6.36608 4.59787 6.50513 4.5052C6.64418 4.41253 6.75406 4.28464 6.82317 4.13558L8.01167 1.3125H8.2417Z"
              fill={i < Math.floor(rating) ? "#FCD34D" : "none"}
              stroke={i < Math.floor(rating) ? "#FCD34D" : "#E5E7EB"}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.33333"
            />
          </g>
        </svg>
      </div>
    ));
  };

  const getProductIcon = (category: string) => {
    switch (category) {
      case 'Smartphones':
        return svgPaths.p35a3c900;
      case 'Laptops':
        return svgPaths.p2fb47d00;
      case 'Headphones':
        return svgPaths.p2fb3dc80;
      case 'Gaming':
        return svgPaths.p1f81fd80;
      default:
        return svgPaths.p35a3c900;
    }
  };

  const getIconColor = (category: string) => {
    switch (category) {
      case 'Smartphones':
        return '#3B82F6';
      case 'Laptops':
        return '#10B981';
      case 'Headphones':
        return '#8B5CF6';
      case 'Gaming':
        return '#EF4444';
      default:
        return '#3B82F6';
    }
  };

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 h-full">
      <div 
        className="bg-gray-50 h-48 flex items-center justify-center cursor-pointer"
        onClick={() => onProductClick?.(product)}
      >
        <div className="relative shrink-0 size-16">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 64 64">
            <g>
              <path d="M64 64H0V0H64V64Z" stroke={`var(--stroke-0, ${getIconColor(product.category)})`} />
              <path
                d={getProductIcon(product.category)}
                stroke={`var(--stroke-0, ${getIconColor(product.category)})`}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="5.33333"
              />
            </g>
          </svg>
        </div>
      </div>
      
      <div className="p-4 flex flex-col h-48">
        <div className="mb-2">
          <h3 
            className="font-semibold text-gray-900 mb-1 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => onProductClick?.(product)}
          >
            {product.name}
          </h3>
          <p className="text-sm text-gray-500">{product.brand} • {t(getCategoryTranslationKey(product.category))}</p>
        </div>
        
        <div className="flex items-center gap-1 mb-2">
          {renderStars(product.rating)}
          <span className="text-xs text-gray-400 ml-1">({product.reviews})</span>
        </div>
        
        <p className="text-sm text-gray-600 mb-4 flex-grow line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          <span className="text-lg font-bold text-gray-900">${product.price}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {t('general.add')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProductCarousel({ products, onAddToCart, onProductClick }: ProductCarouselProps) {
  const { t } = useLanguage();

  const topRatedProducts = useMemo(() => {
    return products
      .filter(product => product.rating >= 4.5)
      .slice(0, 8);
  }, [products]);



  return (
    <div className="bg-white w-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-12 lg:py-20">
        <div className="flex flex-col gap-12 max-w-7xl mx-auto">
          



        </div>
      </div>
    </div>
  );
}