import React from 'react';
import { Product, ColorOption } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { ProductColorSelector } from './ProductColorSelector';

interface ProductOptionsProps {
  product: Product;
  selectedStorage: string;
  onStorageChange: (storage: string) => void;
  selectedColor: string;
  selectedColorName: string;
  onColorSelect: (colorOption: ColorOption) => void;
  colorError?: string;
  quantity: number;
  onQuantityDecrease: () => void;
  onQuantityIncrease: () => void;
}

const storageOptions = ['128GB', '256GB', '512GB', '1TB'];

export function ProductOptions({
  product,
  selectedStorage,
  onStorageChange,
  selectedColor,
  selectedColorName,
  onColorSelect,
  colorError,
  quantity,
  onQuantityDecrease,
  onQuantityIncrease
}: ProductOptionsProps) {
  const { t } = useLanguage();

  return (
    <div className="box-border content-stretch flex flex-col gap-6 items-start justify-start p-0 relative shrink-0 w-full">
      
      {/* Storage Option - Only show for certain products */}
      {(product.category === 'Smartphones' || product.category === 'Tablets') && (
        <div className="box-border content-stretch flex flex-col gap-3 items-start justify-start p-0 relative shrink-0 w-full">
          <div className="font-['Inter:Semi_Bold',_sans-serif] font-semibold leading-[0] not-italic relative shrink-0 text-[16px] text-gray-900 text-left w-full">
            <p className="block leading-[19.2px]">{t('product.storage')}</p>
          </div>
          <div className="flex flex-wrap gap-3 items-start justify-start p-0 relative shrink-0 w-full">
            {storageOptions.map((storage) => (
              <button
                key={storage}
                onClick={() => onStorageChange(storage)}
                className={`${selectedStorage === storage ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-300 text-gray-500'} box-border content-stretch flex flex-row h-10 items-center justify-center p-0 relative rounded-lg shrink-0 w-20 border border-solid hover:border-blue-400 transition-colors`}
              >
                <div className={`font-['Inter:${selectedStorage === storage ? 'Semi_Bold' : 'Medium'}',_sans-serif] font-${selectedStorage === storage ? 'semibold' : 'medium'} leading-[0] not-italic relative shrink-0 text-[14px] text-left text-nowrap`}>
                  <p className="block leading-[16.8px] whitespace-pre">{storage}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Option */}
      {product.hasColorOptions && (
        <ProductColorSelector
          colors={product.colors}
          selectedColor={selectedColor}
          selectedColorName={selectedColorName}
          onColorSelect={onColorSelect}
          colorError={colorError}
        />
      )}

      {/* Quantity Section */}
      <div className="box-border content-stretch flex flex-col gap-3 items-start justify-start p-0 relative shrink-0 w-full">
        <div className="font-['Inter:Semi_Bold',_sans-serif] font-semibold leading-[0] min-w-full not-italic relative shrink-0 text-[16px] text-gray-900 text-left">
          <p className="block leading-[19.2px]">{t('cart.quantity')}</p>
        </div>
        <div className="box-border content-stretch flex flex-row items-center justify-start p-0 relative rounded-lg shrink-0 border border-gray-300 border-solid">
          <button
            onClick={onQuantityDecrease}
            className="bg-[#ffffff] box-border content-stretch flex flex-row items-center justify-center p-0 relative shrink-0 size-10 border-r border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <div className="relative shrink-0 size-4">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                <g>
                  <path d="M16 16H0V0H16V16Z" stroke="var(--stroke-0, #6B7280)" />
                  <path
                    d="M3.33333 8H12.6667"
                    stroke="var(--stroke-0, #6B7280)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.33333"
                  />
                </g>
              </svg>
            </div>
          </button>
          <div className="bg-[#ffffff] box-border content-stretch flex flex-row h-10 items-center justify-center p-0 relative shrink-0 w-[60px] border-r border-gray-300">
            <div className="font-['Inter:Semi_Bold',_sans-serif] font-semibold leading-[0] not-italic relative shrink-0 text-[16px] text-gray-900 text-left text-nowrap">
              <p className="block leading-[19.2px] whitespace-pre">{quantity}</p>
            </div>
          </div>
          <button
            onClick={onQuantityIncrease}
            className="bg-[#ffffff] box-border content-stretch flex flex-row items-center justify-center p-0 relative shrink-0 size-10 hover:bg-gray-50 transition-colors"
          >
            <div className="relative shrink-0 size-4">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                <g>
                  <path d="M16 16H0V0H16V16Z" stroke="var(--stroke-0, #6B7280)" />
                  <path
                    d="M3.33333 8H12.6667"
                    stroke="var(--stroke-0, #6B7280)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.33333"
                  />
                  <path
                    d="M8 3.33333V12.6667"
                    stroke="var(--stroke-0, #6B7280)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.33333"
                  />
                </g>
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}