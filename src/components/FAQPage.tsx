import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, HelpCircle, Package, Truck, CreditCard, User, MessageCircle, ArrowRight, Zap, BookOpen, Star, AlertCircle, Filter } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface FAQPageProps {
  onBackToHome: () => void;
  onContactClick: () => void;
}

interface FAQ {
  question: string;
  answer: string;
  category: string;
  tags?: string[];
  popularity?: number;
}

interface CategoryInfo {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
}

export function FAQPage({ onBackToHome, onContactClick }: FAQPageProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [showPopularOnly, setShowPopularOnly] = useState(false);

  const faqs: FAQ[] = [
    {
      question: t('faq.orderingQuestion1'),
      answer: t('faq.orderingAnswer1'),
      category: 'ordering',
      tags: ['order', 'place', 'purchase'],
      popularity: 95
    },
    {
      question: t('faq.orderingQuestion2'),
      answer: t('faq.orderingAnswer2'),
      category: 'ordering',
      tags: ['cancel', 'modify', 'change'],
      popularity: 87
    },
    {
      question: t('faq.shippingQuestion1'),
      answer: t('faq.shippingAnswer1'),
      category: 'shipping',
      tags: ['delivery', 'time', 'fast'],
      popularity: 92
    },
    {
      question: t('faq.shippingQuestion2'),
      answer: t('faq.shippingAnswer2'),
      category: 'shipping',
      tags: ['track', 'status', 'location'],
      popularity: 89
    },
    {
      question: t('faq.returnsQuestion1'),
      answer: t('faq.returnsAnswer1'),
      category: 'returns',
      tags: ['return', 'policy', 'days'],
      popularity: 85
    },
    {
      question: t('faq.returnsQuestion2'),
      answer: t('faq.returnsAnswer2'),
      category: 'returns',
      tags: ['refund', 'money back', 'process'],
      popularity: 78
    },
    {
      question: t('faq.accountQuestion1'),
      answer: t('faq.accountAnswer1'),
      category: 'account',
      tags: ['create', 'signup', 'register'],
      popularity: 75
    },
    {
      question: t('faq.accountQuestion2'),
      answer: t('faq.accountAnswer2'),
      category: 'account',
      tags: ['password', 'login', 'forgot'],
      popularity: 82
    },
    {
      question: t('faq.paymentQuestion1'),
      answer: t('faq.paymentAnswer1'),
      category: 'payment',
      tags: ['credit card', 'stripe', 'secure'],
      popularity: 88
    },
    {
      question: t('faq.paymentQuestion2'),
      answer: t('faq.paymentAnswer2'),
      category: 'payment',
      tags: ['failed', 'declined', 'error'],
      popularity: 90
    }
  ];

  const categories: CategoryInfo[] = [
    { 
      value: 'all', 
      label: t('faq.allCategories'),
      icon: <BookOpen className="w-6 h-6" />,
      color: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-500/10',
      description: t('faq.allCategoriesDesc')
    },
    { 
      value: 'ordering', 
      label: t('faq.ordering'),
      icon: <Package className="w-6 h-6" />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      description: t('faq.orderingDesc')
    },
    { 
      value: 'shipping', 
      label: t('faq.shipping'),
      icon: <Truck className="w-6 h-6" />,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      description: t('faq.shippingDesc')
    },
    { 
      value: 'returns', 
      label: t('faq.returns'),
      icon: <ArrowRight className="w-6 h-6 rotate-180" />,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-500/10',
      description: t('faq.returnsDesc')
    },
    { 
      value: 'account', 
      label: t('faq.account'),
      icon: <User className="w-6 h-6" />,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      description: t('faq.accountDesc')
    },
    { 
      value: 'payment', 
      label: t('faq.payment'),
      icon: <CreditCard className="w-6 h-6" />,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-500/10',
      description: t('faq.paymentDesc')
    }
  ];

  const filteredFAQs = useMemo(() => {
    const filtered = faqs.filter(faq => {
      const matchesSearch = searchQuery === '' || 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
      const matchesPopularity = !showPopularOnly || (faq.popularity && faq.popularity >= 85);
      
      return matchesSearch && matchesCategory && matchesPopularity;
    });

    // Sort by popularity if no search query
    if (!searchQuery) {
      filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }

    return filtered;
  }, [searchQuery, selectedCategory, showPopularOnly, faqs]);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const handleCategoryClick = (categoryValue: string) => {
    setSelectedCategory(categoryValue);
    setSearchQuery('');
    setOpenFAQ(null);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setShowPopularOnly(false);
    setOpenFAQ(null);
  };

  const selectedCategoryInfo = categories.find(cat => cat.value === selectedCategory) || categories[0];
  const faqCount = selectedCategory === 'all' ? faqs.length : faqs.filter(faq => faq.category === selectedCategory).length;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20">

      {/* Enhanced Hero Section */}
      <section aria-labelledby="faq-heading" className="relative pt-16 pb-20 overflow-hidden">
        {/* Background with gradient and patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-32 right-20 w-24 h-24 bg-cyan-300 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-purple-300 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-full mb-6">
              <HelpCircle className="w-5 h-5" aria-hidden="true" />
              <span className="font-medium">{t('faq.title')}</span>
            </div>

            <h1 id="faq-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {t('faq.title')}
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-10 leading-relaxed max-w-2xl mx-auto">
              {t('faq.subtitle')}
            </p>
            
            {/* Enhanced Search Bar */}
            <div className="relative max-w-2xl mx-auto mb-8">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('faq.searchPlaceholder')}
                aria-label={t('faq.searchPlaceholder')}
                className="w-full pl-12 pr-6 py-4 bg-white/95 backdrop-blur-sm border-2 border-white/20 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-white/20 focus:border-white transition-all duration-300 shadow-lg"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-xl"
                >
                  ×
                </button>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-6 text-white/80">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" aria-hidden="true" />
                <span>{filteredFAQs.length} {t('faq.articlesAvailable')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5" aria-hidden="true" />
                <span>{t('faq.updatedDaily')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" aria-hidden="true" />
                <span>{t('faq.instantAnswers')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section aria-labelledby="faq-categories-heading" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">

          {/* Category Selection */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 id="faq-categories-heading" className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t('faq.browseByCategory')}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {t('faq.browseByCategoryDesc')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {categories.map((category) => (
                <div
                  key={category.value}
                  onClick={() => handleCategoryClick(category.value)}
                  className={`group relative bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border-2 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                    selectedCategory === category.value 
                      ? 'border-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  {/* Background decoration */}
                  <div className={`absolute top-0 right-0 w-24 h-24 ${category.bgColor} rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-opacity`}></div>
                  
                  <div className="relative">
                    <div className={`bg-gradient-to-br ${category.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {category.icon}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {category.label}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                      {category.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                        {category.value === 'all' ? faqs.length : faqs.filter(faq => faq.category === category.value).length} {t('faq.questionsCount')}
                      </span>
                      {selectedCategory === category.value && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters and Results Header */}
          {(searchQuery || selectedCategory !== 'all') && (
            <div className="mb-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {searchQuery ? `${t('faq.searchResultsFor')} "${searchQuery}"` : `${selectedCategoryInfo.label} ${t('faq.questionsWord')}`}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {filteredFAQs.length} {t('faq.questionsWord')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowPopularOnly(!showPopularOnly)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        showPopularOnly 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Star className="w-4 h-4" />
                      {t('faq.popularOnly')}
                    </button>
                    
                    <button
                      onClick={clearSearch}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                    >
                      <Filter className="w-4 h-4" />
                      {t('faq.clear')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FAQ List */}
          <div className="max-w-4xl mx-auto mb-16">
            {filteredFAQs.length > 0 ? (
              <div className="space-y-4">
                {filteredFAQs.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    <button
                      id={`faq-trigger-${index}`}
                      onClick={() => toggleFAQ(index)}
                      aria-expanded={openFAQ === index}
                      aria-controls={`faq-panel-${index}`}
                      className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        {faq.popularity && faq.popularity >= 90 && (
                          <div className="bg-yellow-100 dark:bg-yellow-900/20 p-1 rounded-full">
                            <Star className="w-4 h-4 text-yellow-600 fill-current" aria-hidden="true" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {faq.question}
                          </h3>
                          {faq.tags && (
                            <div className="flex gap-2 flex-wrap">
                              {faq.tags.slice(0, 3).map((tag, tagIndex) => (
                                <span 
                                  key={tagIndex}
                                  className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {faq.popularity && (
                          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                            {faq.popularity}% helpful
                          </span>
                        )}
                        <div className={`transition-transform duration-300 ${openFAQ === index ? 'rotate-180' : ''}`}>
                          <ChevronDown className="w-6 h-6 text-gray-400 group-hover:text-blue-600" aria-hidden="true" />
                        </div>
                      </div>
                    </button>

                    {openFAQ === index && (
                      <div id={`faq-panel-${index}`} role="region" aria-labelledby={`faq-trigger-${index}`} className="px-6 pb-6">
                        <div className="border-t border-gray-100 dark:border-gray-600 pt-4">
                          <div className="prose prose-gray dark:prose-invert max-w-none">
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
                              {faq.answer}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-600">
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <button className="hover:text-green-600 transition-colors">
                                {t('faq.helpful')}
                              </button>
                              <button className="hover:text-red-600 transition-colors">
                                {t('faq.notHelpful')}
                              </button>
                            </div>
                            
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onContactClick();
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                            >
                              {t('faq.stillNeedHelpInline')}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 max-w-md mx-auto">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-6" aria-hidden="true" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {t('faq.noResults')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    {t('faq.tryDifferentSearch')}
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={clearSearch}
                      className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      {t('faq.browseAllQuestions')}
                    </button>
                    <button
                      onClick={onContactClick}
                      className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                      {t('contact.contactUs')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Contact CTA */}
          <div className="text-center bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-12 text-white">
            <div className="max-w-2xl mx-auto">
              <MessageCircle className="w-16 h-16 mx-auto mb-6 opacity-80" aria-hidden="true" />
              <h2 className="text-3xl font-bold mb-4">{t('faq.stillHaveQuestions')}</h2>
              <p className="text-blue-100 mb-8 text-lg leading-relaxed">
                {t('faq.contactDescription')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={onContactClick}
                  className="bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-300 font-semibold transform hover:scale-105 shadow-lg"
                >
                  {t('contact.contactUs')}
                </button>
                <button
                  onClick={() => handleCategoryClick('all')}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl hover:bg-white/20 transition-all duration-300 font-semibold"
                >
                  {t('faq.browseAllFaqs')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}