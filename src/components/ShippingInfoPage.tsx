import React, { useState } from 'react';
import { Truck, Clock, MapPin, Package, Shield, Globe, CheckCircle, ArrowRight, Star, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ShippingInfoPageProps {
  onContactClick: () => void;
  onBackToHome?: () => void;
}

interface ShippingOption {
  id: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  price: string;
  time: string;
  features: string[];
  popular?: boolean;
  color: string;
  bgColor: string;
}

interface PolicyItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function ShippingInfoPage({ onContactClick, onBackToHome }: ShippingInfoPageProps) {
  const { t } = useLanguage();
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);

  const shippingOptions: ShippingOption[] = [
    {
      id: 'standard',
      icon: <Clock className="w-8 h-8" />,
      name: t('shipping.standard'),
      description: t('shipping.standardDescription'),
      price: t('shipping.standardPrice'),
      time: t('shipping.standardTime'),
      features: [t('shipping.freeShippingFeature'), t('shipping.trackingIncluded'), t('shipping.insuranceIncluded')],
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      id: 'express',
      icon: <Truck className="w-8 h-8" />,
      name: t('shipping.express'),
      description: t('shipping.expressDescription'),
      price: t('shipping.expressPrice'),
      time: t('shipping.expressTime'),
      features: [t('shipping.priorityHandling'), t('shipping.realTimeTracking'), t('shipping.signatureRequired')],
      popular: true,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    }
  ];

  const policyItems: PolicyItem[] = [
    {
      id: 'processing',
      title: t('shipping.processingTime'),
      description: t('shipping.processingDescription'),
      icon: <Package className="w-6 h-6 text-blue-600" />
    },
    {
      id: 'tracking',
      title: t('shipping.tracking'),
      description: t('shipping.trackingDescription'),
      icon: <MapPin className="w-6 h-6 text-green-600" />
    },
    {
      id: 'delivery',
      title: t('shipping.deliveryAttempts'),
      description: t('shipping.deliveryDescription'),
      icon: <CheckCircle className="w-6 h-6 text-orange-600" />
    },
    {
      id: 'restrictions',
      title: t('shipping.restrictions'),
      description: t('shipping.restrictionsDescription'),
      icon: <Info className="w-6 h-6 text-red-600" />
    }
  ];

  const togglePolicy = (id: string) => {
    setExpandedPolicy(expandedPolicy === id ? null : id);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20">

      {/* Enhanced Hero Section */}
      <section aria-labelledby="shipping-heading" className="relative pt-16 pb-20 overflow-hidden">
        {/* Background with gradient and patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-32 right-20 w-24 h-24 bg-cyan-300 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-indigo-300 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-full mb-6">
              <Truck className="w-5 h-5" aria-hidden="true" />
              <span className="font-medium">{t('shipping.shippingInfoBadge')}</span>
            </div>

            <h1 id="shipping-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {t('shipping.title')}
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-10 leading-relaxed max-w-2xl mx-auto">
              {t('shipping.subtitle')}
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-6 text-white/80">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5" aria-hidden="true" />
                <span>{t('shipping.worldwideShipping')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" aria-hidden="true" />
                <span>{t('shipping.insuredPackages')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5" aria-hidden="true" />
                <span>{t('shipping.realTimeTrackingBadge')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section aria-labelledby="shipping-options-heading" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">

          {/* Shipping Options */}
          <section aria-labelledby="shipping-options-heading" className="mb-20">
            <div className="text-center mb-12">
              <h2 id="shipping-options-heading" className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t('shipping.options')}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {t('shipping.chooseOption')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {shippingOptions.map((option, index) => (
                <div
                  key={option.id}
                  className={`relative group bg-white dark:bg-gray-800 rounded-3xl shadow-lg border-2 transition-all duration-300 hover:shadow-2xl hover:scale-105 overflow-hidden ${
                    option.popular 
                      ? 'border-green-500 ring-4 ring-green-100 dark:ring-green-900/20 transform scale-105' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500'
                  }`}
                >
                  {/* Background decoration */}
                  <div className={`absolute top-0 right-0 w-32 h-32 ${option.bgColor} rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-opacity`}></div>
                  
                  {/* Popular badge */}
                  {option.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                        {t('shipping.mostPopular')}
                      </div>
                    </div>
                  )}
                  
                  <div className="relative p-8 text-center">
                    {/* Icon with gradient */}
                    <div className={`bg-gradient-to-br ${option.color} w-20 h-20 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg mx-auto group-hover:scale-110 transition-transform duration-300`}>
                      {option.icon}
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {option.name}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                      {option.description}
                    </p>
                    
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        {option.price}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {option.time}
                      </div>
                    </div>
                    
                    {/* Features */}
                    <div className="space-y-2 mb-6">
                      {option.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <button className={`w-full bg-gradient-to-r ${option.color} text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 font-medium transform hover:scale-105`}>
                      {t('shipping.selectOption')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Shipping Zones */}
          <section aria-labelledby="shipping-zones-heading" className="mb-20">
            <div className="text-center mb-12">
              <h2 id="shipping-zones-heading" className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t('shipping.zones')}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {t('shipping.chooseOption')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Domestic Shipping */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-500 w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {t('shipping.domestic')}
                    </h3>
                    <p className="text-green-600 dark:text-green-400 font-medium">{t('shipping.freeShippingAvailable')}</p>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {t('shipping.domesticDescription')}
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">{t('shipping.domesticZone1')}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">{t('shipping.domesticZone2')}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">{t('shipping.domesticZone3')}</span>
                  </div>
                </div>
              </div>

              {/* International Shipping */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-500 w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Globe className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {t('shipping.international')}
                    </h3>
                    <p className="text-blue-600 dark:text-blue-400 font-medium">{t('shipping.euCoverage')}</p>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {t('shipping.internationalDescription')}
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Globe className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-700 dark:text-gray-300">{t('shipping.internationalZone1')}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Globe className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-700 dark:text-gray-300">{t('shipping.internationalZone2')}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Globe className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-700 dark:text-gray-300">{t('shipping.internationalZone3')}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Shipping Policy */}
          <section aria-labelledby="shipping-policy-heading" className="mb-16">
            <div className="text-center mb-12">
              <h2 id="shipping-policy-heading" className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t('shipping.policyTitle')}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {t('shipping.policySubtitle')}
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto space-y-4">
              {policyItems.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <button
                    id={`shipping-policy-trigger-${item.id}`}
                    onClick={() => togglePolicy(item.id)}
                    aria-expanded={expandedPolicy === item.id}
                    aria-controls={`shipping-policy-panel-${item.id}`}
                    className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl group-hover:scale-110 transition-transform duration-300" aria-hidden="true">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                    
                    <div className={`transition-transform duration-300 ${expandedPolicy === item.id ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-6 h-6 text-gray-400 group-hover:text-blue-600" aria-hidden="true" />
                    </div>
                  </button>

                  {expandedPolicy === item.id && (
                    <div id={`shipping-policy-panel-${item.id}`} role="region" aria-labelledby={`shipping-policy-trigger-${item.id}`} className="px-6 pb-6">
                      <div className="border-t border-gray-100 dark:border-gray-600 pt-4 ml-16">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Enhanced Contact CTA */}
          <div className="text-center bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-12 text-white">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-white" aria-hidden="true" />
              </div>
              <h2 className="text-3xl font-bold mb-4">{t('shipping.questions')}</h2>
              <p className="text-blue-100 mb-8 text-lg leading-relaxed">
                {t('shipping.contactDescription')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={onContactClick}
                  className="bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-300 font-semibold transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  {t('contact.contactUs')}
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </button>
                <button className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl hover:bg-white/20 transition-all duration-300 font-semibold">
                  {t('shipping.trackOrder')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}