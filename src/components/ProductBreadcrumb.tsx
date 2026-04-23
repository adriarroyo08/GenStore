import React from 'react';
import { Product } from '../App';
import { useLanguage } from '../contexts/LanguageContext';

interface ProductBreadcrumbProps {
  product: Product;
  onBackToHome: () => void;
  onBackToCatalog: () => void;
}

export function ProductBreadcrumb({ product, onBackToHome, onBackToCatalog }: ProductBreadcrumbProps) {
  const { t } = useLanguage();

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
    <div className="bg-gray-50 relative shrink-0 w-full">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start px-4 sm:px-6 lg:px-20 py-4 relative w-full">
          <div className="box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 relative shrink-0">
            <button 
              onClick={onBackToHome}
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[14px] text-gray-500 text-left text-nowrap hover:text-gray-700 transition-colors"
            >
              <p className="block leading-[16.8px] whitespace-pre">{t('breadcrumb.home')}</p>
            </button>
            <div className="relative shrink-0 size-4">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                <g>
                  <path d="M16 16H0V0H16V16Z" stroke="var(--stroke-0, #9CA3AF)" />
                  <path
                    d="M6 12L10 8L6 4"
                    stroke="var(--stroke-0, #9CA3AF)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.33333"
                  />
                </g>
              </svg>
            </div>
            <button 
              onClick={onBackToCatalog}
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[14px] text-gray-500 text-left text-nowrap hover:text-gray-700 transition-colors"
            >
              <p className="block leading-[16.8px] whitespace-pre">{t(getCategoryTranslationKey(product.category))}</p>
            </button>
            <div className="relative shrink-0 size-4">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                <g>
                  <path d="M16 16H0V0H16V16Z" stroke="var(--stroke-0, #9CA3AF)" />
                  <path
                    d="M6 12L10 8L6 4"
                    stroke="var(--stroke-0, #9CA3AF)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.33333"
                  />
                </g>
              </svg>
            </div>
            <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] not-italic relative shrink-0 text-[14px] text-gray-900 text-left text-nowrap">
              <p className="block leading-[16.8px] whitespace-pre">{product.name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}