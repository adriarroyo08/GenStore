import React from 'react';
import svgPaths from "../imports/svg-qj3qnkiz1f";
import { Product } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';

interface ProductTabsProps {
  product: Product;
  selectedTab: string;
  onTabChange: (tab: string) => void;
  renderStars: (rating: number, size?: string) => React.ReactNode;
}

export function ProductTabs({ product, selectedTab, onTabChange, renderStars }: ProductTabsProps) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

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
        <div className="box-border content-stretch flex flex-col items-start justify-start px-4 sm:px-6 lg:px-20 py-16 relative w-full">
          
          {/* Tab Navigation */}
          <div className="box-border content-stretch flex flex-row gap-0 items-start justify-start p-0 relative shrink-0 w-full">
            {[
              { id: 'description', label: t('product.description') },
              { id: 'specifications', label: t('product.specifications') },
              { id: 'reviews', label: t('product.reviews') }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`${selectedTab === tab.id ? 'bg-white border-gray-200 text-gray-900' : 'bg-transparent border-transparent text-gray-500 hover:text-gray-700'} box-border content-stretch flex flex-row h-14 items-center justify-center p-0 relative shrink-0 w-[200px] border-b-2 border-solid transition-colors`}
              >
                <div className={`font-['Inter:${selectedTab === tab.id ? 'Semi_Bold' : 'Medium'}',_sans-serif] font-${selectedTab === tab.id ? 'semibold' : 'medium'} leading-[0] not-italic relative shrink-0 text-[16px] text-left text-nowrap`}>
                  <p className="block leading-[19.2px] whitespace-pre">{tab.label}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white relative rounded-b-2xl rounded-tr-2xl shrink-0 w-full border border-gray-200 border-solid">
            <div className="relative size-full">
              <div className="box-border content-stretch flex flex-col items-start justify-start p-[32px] relative w-full">
                {selectedTab === 'description' && (
                  <div className="box-border content-stretch flex flex-col gap-6 items-start justify-start p-0 relative shrink-0 w-full">
                    <div className="font-['Inter:Bold',_sans-serif] font-bold leading-[0] not-italic relative shrink-0 text-[24px] text-gray-900 text-left w-full">
                      <p className="block leading-[28.8px]">{t('product.productDescription')}</p>
                    </div>
                    <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[16px] text-gray-500 text-left w-full">
                      <p className="block leading-[24px]">
                        {product.description}. {t('product.extendedDescription1')}
                      </p>
                    </div>
                    <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[16px] text-gray-500 text-left w-full">
                      <p className="block leading-[24px]">
                        {t('product.extendedDescription2')}
                      </p>
                    </div>
                    
                    {/* What's in the Box */}
                    <div className="box-border content-stretch flex flex-col gap-4 items-start justify-start p-0 relative shrink-0 w-full">
                      <div className="font-['Inter:Semi_Bold',_sans-serif] font-semibold leading-[0] not-italic relative shrink-0 text-[18px] text-gray-900 text-left w-full">
                        <p className="block leading-[21.6px]">{t('product.whatsInTheBox')}</p>
                      </div>
                      <div className="box-border content-stretch flex flex-col gap-2 items-start justify-start p-0 relative shrink-0 w-full">
                        {[
                          { icon: svgPaths.p253800, text: product.name },
                          { icon: svgPaths.p37386f80, text: t('product.usbCable') },
                          { icon: svgPaths.p19416e00, text: t('product.documentation') }
                        ].map((item, index) => (
                          <div key={index} className="box-border content-stretch flex flex-row gap-3 items-center justify-start p-0 relative shrink-0 w-full">
                            <div className="relative shrink-0 size-4">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                                <g>
                                  <path d="M16 16H0V0H16V16Z" stroke="var(--stroke-0, #6B7280)" />
                                  <path
                                    d={item.icon}
                                    stroke="var(--stroke-0, #6B7280)"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="1.33333"
                                  />
                                </g>
                              </svg>
                            </div>
                            <div className="basis-0 font-['Inter:Regular',_sans-serif] font-normal grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[14px] text-gray-500 text-left">
                              <p className="block leading-[16.8px]">{item.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedTab === 'specifications' && (
                  <div className="box-border content-stretch flex flex-col gap-6 items-start justify-start p-0 relative shrink-0 w-full">
                    <div className="font-['Inter:Bold',_sans-serif] font-bold leading-[0] not-italic relative shrink-0 text-[24px] text-gray-900 text-left w-full">
                      <p className="block leading-[28.8px]">{t('product.technicalSpecs')}</p>
                    </div>
                    <div className="w-full space-y-4">
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="font-medium text-gray-900">{t('product.brand')}</span>
                        <span className="text-gray-500">{product.brand}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="font-medium text-gray-900">{t('product.category')}</span>
                        <span className="text-gray-500">{t(getCategoryTranslationKey(product.category))}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="font-medium text-gray-900">{t('product.price')}</span>
                        <span className="text-gray-500">{formatPrice(product.price)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="font-medium text-gray-900">{t('product.rating')}</span>
                        <span className="text-gray-500">{product.rating}/5 {t('product.stars')}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedTab === 'reviews' && (
                  <div className="box-border content-stretch flex flex-col gap-6 items-start justify-start p-0 relative shrink-0 w-full">
                    <div className="font-['Inter:Bold',_sans-serif] font-bold leading-[0] not-italic relative shrink-0 text-[24px] text-gray-900 text-left w-full">
                      <p className="block leading-[28.8px]">{t('product.reviewsCount', { count: product.reviews })}</p>
                    </div>
                    <div className="w-full space-y-6">
                      <div className="border-b border-gray-200 pb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">{renderStars(5, "size-4")}</div>
                          <span className="font-medium text-gray-900">{t('product.customerName1')}</span>
                          <span className="text-gray-500">• {t('product.daysAgo', { count: 2 })}</span>
                        </div>
                        <p className="text-gray-700">{t('product.customerReview1')}</p>
                      </div>
                      <div className="border-b border-gray-200 pb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">{renderStars(4, "size-4")}</div>
                          <span className="font-medium text-gray-900">{t('product.customerName2')}</span>
                          <span className="text-gray-500">• {t('product.weekAgo')}</span>
                        </div>
                        <p className="text-gray-700">{t('product.customerReview2')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}