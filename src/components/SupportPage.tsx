import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, HelpCircle, MessageCircle, Phone, Mail, Clock, Shield, BookOpen, Zap, ChevronRight, ExternalLink, Headphones, Package, CreditCard, Truck, User, FileText, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SupportPageProps {
  onBackToHome: () => void;
  onContactClick: () => void;
}

interface SupportArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  tags: string[];
}

export function SupportPage({ onBackToHome, onContactClick }: SupportPageProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllArticles, setShowAllArticles] = useState(false);

  // Comprehensive support articles database
  const supportArticles: SupportArticle[] = [
    // Order Support
    {
      id: 'order-status',
      title: t('support.orderStatus'),
      description: t('support.orderStatusArticle'),
      category: 'order',
      content: t('support.orderStatusContent'),
      tags: ['order', 'tracking', 'status', 'delivery']
    },
    {
      id: 'order-cancellation',
      title: t('support.orderCancellationTitle'),
      description: t('support.orderCancellationDesc'),
      category: 'order',
      content: t('support.orderCancellationContent'),
      tags: ['order', 'cancel', 'refund']
    },
    {
      id: 'order-modification',
      title: t('support.orderModificationTitle'),
      description: t('support.orderModificationDesc'),
      category: 'order',
      content: t('support.orderModificationContent'),
      tags: ['order', 'modify', 'address', 'change']
    },
    
    // Technical Support
    {
      id: 'device-setup',
      title: t('support.productSetupTitle'),
      description: t('support.productSetupDesc'),
      category: 'technical',
      content: t('support.productSetupContent'),
      tags: ['setup', 'installation', 'device', 'technical']
    },
    {
      id: 'troubleshooting',
      title: t('support.troubleshootingTitle'),
      description: t('support.troubleshootingDesc'),
      category: 'technical',
      content: t('support.troubleshootingContent'),
      tags: ['troubleshooting', 'problems', 'fix', 'technical']
    },
    {
      id: 'warranty-claims',
      title: t('support.warrantyClaimsTitle'),
      description: t('support.warrantyClaimsDesc'),
      category: 'technical',
      content: t('support.warrantyClaimsContent'),
      tags: ['warranty', 'repair', 'claims', 'coverage']
    },
    
    // General Questions
    {
      id: 'account-creation',
      title: t('support.accountCreationTitle'),
      description: t('support.accountCreationDesc'),
      category: 'general',
      content: t('support.accountCreationContent'),
      tags: ['account', 'signup', 'register', 'profile']
    },
    {
      id: 'payment-methods',
      title: t('support.paymentMethodsTitle'),
      description: t('support.paymentMethodsDesc'),
      category: 'general',
      content: t('support.paymentMethodsContent'),
      tags: ['payment', 'credit card', 'stripe', 'security']
    },
    {
      id: 'privacy-security',
      title: t('support.privacySecurityTitle'),
      description: t('support.privacySecurityDesc'),
      category: 'general',
      content: t('support.privacySecurityContent'),
      tags: ['privacy', 'security', 'data protection', 'gdpr']
    },
    
    // Shipping and Returns
    {
      id: 'shipping-options',
      title: t('support.shipping'),
      description: t('support.shippingOptionsDesc'),
      category: 'shipping',
      content: t('support.shippingOptionsContent'),
      tags: ['shipping', 'delivery', 'cost', 'free shipping']
    },
    {
      id: 'return-policy',
      title: t('support.returnPolicy'),
      description: t('support.returnPolicyArticle'),
      category: 'shipping',
      content: t('support.returnPolicyContent'),
      tags: ['returns', 'refund', 'exchange', 'policy']
    },
    {
      id: 'international-shipping',
      title: t('support.internationalShippingTitle'),
      description: t('support.internationalShippingDesc'),
      category: 'shipping',
      content: t('support.internationalShippingContent'),
      tags: ['international', 'worldwide', 'customs', 'global']
    }
  ];

  const supportCategories = [
    {
      icon: <HelpCircle className="w-8 h-8" />,
      title: t('support.generalQuestions'),
      description: t('support.generalDescription'),
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      category: 'general',
      articles: supportArticles.filter(a => a.category === 'general').length
    },
    {
      icon: <Package className="w-8 h-8" />,
      title: t('support.orderSupport'),
      description: t('support.orderDescription'),
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      category: 'order',
      articles: supportArticles.filter(a => a.category === 'order').length
    },
    {
      icon: <Headphones className="w-8 h-8" />,
      title: t('support.technicalSupport'),
      description: t('support.technicalDescription'),
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      category: 'technical',
      articles: supportArticles.filter(a => a.category === 'technical').length
    },
    {
      icon: <Truck className="w-8 h-8" />,
      title: t('support.shippingAndReturns'),
      description: t('support.shippingAndReturnsDescription'),
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-500/10',
      category: 'shipping',
      articles: supportArticles.filter(a => a.category === 'shipping').length
    }
  ];

  const contactMethods = [
    {
      icon: <Phone className="w-8 h-8" />,
      title: t('support.phoneSupport'),
      description: t('support.phoneDescription'),
      value: t('contact.contactPhone'),
      available: t('support.available247'),
      color: 'from-green-500 to-emerald-600',
      action: () => window.open(`tel:${t('contact.contactPhone')}`, '_self')
    },
    {
      icon: <Mail className="w-8 h-8" />,
      title: t('support.emailSupport'),
      description: t('support.emailDescription'),
      value: t('contact.contactEmail'),
      available: t('support.responseTime24h'),
      color: 'from-blue-500 to-cyan-600',
      action: () => window.open(`mailto:${t('contact.contactEmail')}`, '_blank')
    }
  ];

  const quickLinks = [
    { 
      icon: <Package className="w-5 h-5" />, 
      title: t('support.orderStatus'), 
      action: () => setSelectedCategory('order')
    },
    { 
      icon: <Truck className="w-5 h-5" />, 
      title: t('support.shipping'), 
      action: () => setSelectedCategory('shipping')
    },
    { 
      icon: <CreditCard className="w-5 h-5" />, 
      title: t('support.returnPolicy'), 
      action: () => setSelectedCategory('shipping')
    },
    { 
      icon: <Shield className="w-5 h-5" />, 
      title: t('support.paymentIssues'), 
      action: () => setSelectedCategory('general')
    }
  ];

  const faqItems = [
    {
      question: t('support.orderStatus'),
      answer: t('support.orderStatusDescription')
    },
    {
      question: t('support.returnPolicy'),
      answer: t('support.returnPolicyDescription')
    },
    {
      question: t('support.shipping'),
      answer: t('support.shippingDescription')
    },
    {
      question: t('support.paymentIssues'),
      answer: t('support.paymentDescription')
    }
  ];

  // Search and filter functionality
  const filteredArticles = useMemo(() => {
    let articles = supportArticles;
    
    // Filter by category if selected
    if (selectedCategory) {
      articles = articles.filter(article => article.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      articles = articles.filter(article => 
        article.title.toLowerCase().includes(query) ||
        article.description.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return articles;
  }, [searchQuery, selectedCategory]);

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
    setSearchQuery('');
    setShowAllArticles(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim()) {
      setShowAllArticles(true);
      setSelectedCategory(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setShowAllArticles(false);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20">
      {/* Hero Section with Enhanced Styling */}
      <section aria-labelledby="support-heading" className="relative pt-16 pb-20 overflow-hidden">
        {/* Background with gradient and patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-32 right-20 w-24 h-24 bg-cyan-300 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-purple-300 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-full mb-6">
              <Headphones className="w-5 h-5" aria-hidden="true" />
              <span className="font-medium">{t('support.available247')}</span>
            </div>

            <h1 id="support-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {t('support.title')}
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-10 leading-relaxed max-w-2xl mx-auto">
              {t('support.subtitle')}
            </p>
            
            {/* Enhanced Search Bar */}
            <div className="relative max-w-2xl mx-auto mb-8">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={t('support.searchPlaceholder')}
                aria-label={t('support.searchPlaceholder')}
                className="w-full pl-12 pr-6 py-4 bg-white/95 backdrop-blur-sm border-2 border-white/20 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-white/20 focus:border-white transition-all duration-300 shadow-lg"
              />
              {searchQuery && (
                <button
                  onClick={clearFilters}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              {quickLinks.map((link, index) => (
                <button
                  key={index}
                  onClick={link.action}
                  className="group flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-full transition-all duration-300 hover:scale-105"
                >
                  {link.icon}
                  <span className="font-medium">{link.title}</span>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section aria-labelledby="support-help-heading" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Search Results or Category Filter */}
          {(searchQuery || selectedCategory) && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {searchQuery ? `${t('support.searchResultsFor')} "${searchQuery}"` :
                     selectedCategory ? `${supportCategories.find(c => c.category === selectedCategory)?.title}` :
                     t('support.browseCategories')}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {filteredArticles.length} {t('support.articlesWord')}
                  </p>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  {t('support.clearFilters')}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredArticles.map((article) => (
                  <div key={article.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2">{article.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">{article.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2 flex-wrap">
                            {article.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors text-sm font-medium">
                            {t('support.readMore')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredArticles.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('support.noArticlesFound')}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {t('support.noArticlesDescription')}
                  </p>
                  <button
                    onClick={clearFilters}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('support.browseCategories')}
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Support Categories - Show when no search/filter active */}
          {!searchQuery && !selectedCategory && (
            <div className="mb-20">
              <div className="text-center mb-16">
                <h2 id="support-help-heading" className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {t('support.howCanWeHelp')}
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  {t('support.browseHelpTopics')}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {supportCategories.map((category, index) => (
                  <div 
                    key={index} 
                    onClick={() => handleCategoryClick(category.category)}
                    className="group relative bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden"
                  >
                    {/* Decorative background */}
                    <div className={`absolute top-0 right-0 w-32 h-32 ${category.bgColor} rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-300`}></div>
                    
                    <div className="relative">
                      <div className={`bg-gradient-to-br ${category.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        {category.icon}
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                        {category.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                        {category.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                          {category.articles} {t('support.articlesCount')}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Methods */}
          <section aria-labelledby="support-contact-heading" className="mb-20">
            <div className="text-center mb-16">
              <h2 id="support-contact-heading" className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t('support.getInTouch')}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                {t('support.multipleContactWays')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {contactMethods.map((method, index) => (
                <div key={index} className="group bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 text-center hover:shadow-2xl transition-all duration-300">
                  <div className={`bg-gradient-to-br ${method.color} w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {method.icon}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {method.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    {method.description}
                  </p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={method.action}
                      className={`inline-block bg-gradient-to-r ${method.color} text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300`}
                    >
                      {method.value}
                    </button>
                    
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      {method.available}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ Section - Show when no search/filter active */}
          {!searchQuery && !selectedCategory && (
            <section aria-labelledby="support-faq-heading" className="mb-20">
              <div className="text-center mb-16">
                <h2 id="support-faq-heading" className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {t('support.commonIssues')}
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  {t('support.quickAnswers')}
                </p>
              </div>
              
              <div className="max-w-4xl mx-auto space-y-4">
                {faqItems.map((item, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <button
                      id={`support-faq-trigger-${index}`}
                      onClick={() => toggleFAQ(index)}
                      aria-expanded={expandedFAQ === index}
                      aria-controls={`support-faq-panel-${index}`}
                      className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      <span className="text-lg font-semibold text-gray-900 dark:text-white pr-4">
                        {item.question}
                      </span>
                      <div className={`transform transition-transform duration-200 ${
                        expandedFAQ === index ? 'rotate-180' : ''
                      }`}>
                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {expandedFAQ === index && (
                      <div id={`support-faq-panel-${index}`} role="region" aria-labelledby={`support-faq-trigger-${index}`} className="px-8 pb-6">
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-12 text-white">
            <div className="max-w-2xl mx-auto">
              <Zap className="w-16 h-16 mx-auto mb-6 opacity-80" aria-hidden="true" />
              <h2 className="text-3xl font-bold mb-4">{t('support.stillNeedHelp')}</h2>
              <p className="text-blue-100 mb-8 text-lg leading-relaxed">
                {t('support.contactUsDescription')}
              </p>
              <button
                onClick={onContactClick}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-300 font-semibold transform hover:scale-105 shadow-lg"
              >
                {t('contact.contactUs')}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}