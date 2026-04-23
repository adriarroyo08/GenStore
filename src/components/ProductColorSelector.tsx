import React from 'react';
import { ColorOption } from '../App';
import { useLanguage } from '../contexts/LanguageContext';

interface ProductColorSelectorProps {
  colors?: ColorOption[];
  selectedColor: string;
  selectedColorName: string;
  onColorSelect: (colorOption: ColorOption) => void;
  colorError?: string;
}

export function ProductColorSelector({
  colors,
  selectedColor,
  selectedColorName,
  onColorSelect,
  colorError
}: ProductColorSelectorProps) {
  const { t } = useLanguage();

  if (!colors || colors.length === 0) {
    return null;
  }

  return (
    <div className="box-border content-stretch flex flex-col gap-3 items-start justify-start p-0 relative shrink-0 w-full">
      <div className="font-['Inter:Semi_Bold',_sans-serif] font-semibold leading-[0] not-italic relative shrink-0 text-[16px] text-gray-900 text-left w-full">
        <p className="block leading-[19.2px]">{t('product.color')}</p>
      </div>
      
      {selectedColorName && (
        <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[14px] text-gray-600 text-left w-full">
          <p className="block leading-[16.8px]">{t('product.selectedColor', { color: selectedColorName })}</p>
        </div>
      )}

      <div className="box-border content-stretch flex flex-row gap-3 items-start justify-start p-0 relative shrink-0 w-full flex-wrap">
        {colors.map((colorOption) => (
          <button
            key={colorOption.value}
            onClick={() => onColorSelect(colorOption)}
            disabled={!colorOption.available}
            className={`${colorOption.color} relative rounded-[20px] shrink-0 size-12 border-[3px] border-solid transition-all duration-200 ${
              selectedColor === colorOption.value 
                ? 'border-blue-500 scale-110' 
                : colorOption.available 
                  ? 'border-gray-300 hover:border-blue-400' 
                  : 'border-gray-200 opacity-50 cursor-not-allowed'
            }`}
            title={`${colorOption.name}${!colorOption.available ? ` - ${t('product.unavailableColor')}` : ''}`}
          >
            {!colorOption.available && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-0.5 bg-gray-500 rotate-45"></div>
              </div>
            )}
            {selectedColor === colorOption.value && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative shrink-0 size-4 text-blue-600">
                  <svg className="block size-full" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {colorError && (
        <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[14px] text-red-600 text-left w-full">
          <p className="block leading-[16.8px]">{colorError}</p>
        </div>
      )}
    </div>
  );
}