import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Shield, Truck, Star, Headphones, CreditCard, Award, ArrowLeft, CheckCircle } from 'lucide-react';

interface LearnMorePageProps {
  onBack: () => void;
  onContactClick?: () => void;
}

export function LearnMorePage({ onBack, onContactClick }: LearnMorePageProps) {
  const { t } = useLanguage();

  const benefits = [
    {
      icon: <Truck className="w-8 h-8" />,
      title: t('learnMore.freeShipping.title'),
      description: t('learnMore.freeShipping.description'),
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: t('learnMore.warranty.title'),
      description: t('learnMore.warranty.description'),
      color: 'text-green-600 dark:text-green-400'
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: t('learnMore.loyaltyPoints.title'),
      description: t('learnMore.loyaltyPoints.description'),
      color: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      icon: <Headphones className="w-8 h-8" />,
      title: t('learnMore.support.title'),
      description: t('learnMore.support.description'),
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: t('learnMore.securePayment.title'),
      description: t('learnMore.securePayment.description'),
      color: 'text-red-600 dark:text-red-400'
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: t('learnMore.quality.title'),
      description: t('learnMore.quality.description'),
      color: 'text-indigo-600 dark:text-indigo-400'
    }
  ];

  const features = [
    t('learnMore.features.easyReturns'),
    t('learnMore.features.priceMatch'),
    t('learnMore.features.fastDelivery'),
    t('learnMore.features.productReviews'),
    t('learnMore.features.exclusiveDeals'),
    t('learnMore.features.multilingual')
  ];

  return (
    <section aria-labelledby="learnmore-heading" className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1920&h=600&fit=crop&auto=format"
            alt="Modern technology workspace"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-indigo-800/80 dark:from-slate-900/90 dark:to-slate-800/90"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-8 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            {t('general.back')}
          </button>

          <div className="text-center">
            <h1 id="learnmore-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              {t('learnMore.hero.title')}
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-3xl mx-auto drop-shadow-md">
              {t('learnMore.hero.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Benefits Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <section aria-labelledby="learnmore-benefits-heading" className="text-center mb-16">
          <h2 id="learnmore-benefits-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('learnMore.benefits.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('learnMore.benefits.subtitle')}
          </p>
        </section>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {benefits.map((benefit, index) => (
            <article
              key={index}
              className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className={`${benefit.color} mb-4`} aria-hidden="true">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </article>
          ))}
        </div>

        {/* Additional Features Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 sm:p-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              {t('learnMore.additionalFeatures.title')}
            </h3>
            <p className="text-lg text-muted-foreground">
              {t('learnMore.additionalFeatures.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" aria-hidden="true" />
                <span className="text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            {t('learnMore.cta.title')}
          </h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('learnMore.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={onBack}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {t('learnMore.cta.startShopping')}
            </button>
            <button
              onClick={() => {
                if (onContactClick) onContactClick();
                else onBack();
              }}
              className="border-2 border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary/10 transition-all duration-300 transform hover:scale-105"
            >
              {t('learnMore.cta.contactUs')}
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-16 pt-16 border-t border-border">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
              {t('learnMore.stats.customers')}
            </div>
            <div className="text-muted-foreground">
              {t('learnMore.stats.customersLabel')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
              {t('learnMore.stats.products')}
            </div>
            <div className="text-muted-foreground">
              {t('learnMore.stats.productsLabel')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
              {t('learnMore.stats.satisfaction')}
            </div>
            <div className="text-muted-foreground">
              {t('learnMore.stats.satisfactionLabel')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
              {t('learnMore.stats.countries')}
            </div>
            <div className="text-muted-foreground">
              {t('learnMore.stats.countriesLabel')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}