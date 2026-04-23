import React, { useState } from 'react';
import svgPaths from "../imports/svg-a92dwqnic8";
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Product, CartItem } from '../App';
import { User, Phone, Mail, Send, Clock, Globe, Check, X } from 'lucide-react';

interface ContactPageProps {
  user: any;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cartItemsCount: number;
  cart: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  cartTotal: number;
  onLoginClick: () => void;
  onLogout: () => void;
  onBackToHome: () => void;
  onCartClick: () => void;
  products: Product[];
  onProductSelect: (product: Product) => void;
  onSearch: (query: string) => void;
  setCurrentPage: (page: string) => void;
}

export function ContactPage({
  user,
  searchQuery,
  setSearchQuery,
  cartItemsCount,
  cart,
  updateQuantity,
  removeFromCart,
  cartTotal,
  onLoginClick,
  onLogout,
  onBackToHome,
  onCartClick,
  products,
  onProductSelect,
  onSearch,
  setCurrentPage
}: ContactPageProps) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // FAQ state
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const subjectOptions = [
    { value: 'general', label: t('contact.subjectOptions.general') },
    { value: 'order', label: t('contact.subjectOptions.order') },
    { value: 'technical', label: t('contact.subjectOptions.technical') },
    { value: 'billing', label: t('contact.subjectOptions.billing') },
    { value: 'returns', label: t('contact.subjectOptions.returns') }
  ];

  const faqItems = [
    {
      id: 'return-policy',
      question: t('contact.faqReturnPolicy'),
      answer: t('contact.faqReturnPolicyAnswer')
    },
    {
      id: 'shipping',
      question: t('contact.faqShipping'),
      answer: t('contact.faqShippingAnswer')
    },
    {
      id: 'warranty',
      question: t('contact.faqWarranty'),
      answer: t('contact.faqWarrantyAnswer')
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = `${t('contact.firstName')} ${t('contact.required').toLowerCase()}`;
    }
    if (!formData.lastName.trim()) {
      errors.lastName = `${t('contact.lastName')} ${t('contact.required').toLowerCase()}`;
    }
    if (!formData.email.trim()) {
      errors.email = `${t('contact.emailAddress')} ${t('contact.required').toLowerCase()}`;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('contact.invalidEmail');
    }
    if (!formData.subject) {
      errors.subject = `${t('contact.subject')} ${t('contact.required').toLowerCase()}`;
    }
    if (!formData.message.trim()) {
      errors.message = `${t('contact.message')} ${t('contact.required').toLowerCase()}`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Contact form submitted:', formData);
      
      setSubmitMessage({ type: 'success', message: t('contact.messageSent') });
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });

      // Clear success message after 5 seconds
      setTimeout(() => setSubmitMessage(null), 5000);
    } catch (error) {
      setSubmitMessage({ type: 'error', message: t('contact.messageError') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const handleCallClick = () => {
    window.open(`tel:${t('contact.contactPhone')}`, '_self');
  };

  const handleEmailClick = () => {
    window.open(`mailto:${t('contact.contactEmail')}`, '_blank');
  };



  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20">
      {/* Hero Section with Enhanced Styling */}
      <section aria-labelledby="contact-heading" className="relative pt-16 pb-16 sm:pb-20 overflow-hidden">
        {/* Background with gradient and patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-32 right-20 w-24 h-24 bg-cyan-300 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-purple-300 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 id="contact-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {t('contact.getInTouch')}
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 leading-relaxed max-w-2xl mx-auto">
              {t('contact.heroSubtitle')}
            </p>
            
            {/* Quick contact buttons */}
            <div className="flex flex-wrap justify-center gap-4 mt-10">
              <button
                onClick={handleCallClick}
                className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-full transition-all duration-300 hover:scale-105"
              >
                <Phone className="w-5 h-5" aria-hidden="true" />
                <span className="font-medium">{t('contact.callUs')}</span>
              </button>
              <button
                onClick={handleEmailClick}
                className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-full transition-all duration-300 hover:scale-105"
              >
                <Mail className="w-5 h-5" aria-hidden="true" />
                <span className="font-medium">{t('contact.emailUs')}</span>
              </button>

            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section aria-labelledby="contact-form-heading" className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16 max-w-7xl mx-auto">
            
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-white">
                  <h2 id="contact-form-heading" className="text-3xl font-bold mb-2">{t('contact.sendMessage')}</h2>
                  <p className="text-blue-100 opacity-90">{t('contact.formSubtitle')}</p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                  {/* Success/Error Message */}
                  {submitMessage && (
                    <div role="alert" className={`p-4 rounded-xl border-2 ${
                      submitMessage.type === 'success' 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-1 rounded-full ${
                          submitMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {submitMessage.type === 'success' ? (
                            <Check className="w-4 h-4 text-white" aria-hidden="true" />
                          ) : (
                            <X className="w-4 h-4 text-white" aria-hidden="true" />
                          )}
                        </div>
                        <span className={`font-medium ${
                          submitMessage.type === 'success' 
                            ? 'text-green-800 dark:text-green-200' 
                            : 'text-red-800 dark:text-red-200'
                        }`}>
                          {submitMessage.message}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="field-contact-firstName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t('contact.firstName')} *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          id="field-contact-firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          aria-required="true"
                          aria-describedby={formErrors.firstName ? 'error-contact-firstName' : undefined}
                          className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-600 transition-colors duration-200 ${
                            formErrors.firstName
                              ? 'border-red-300 focus:border-red-500'
                              : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                          }`}
                          placeholder={t('contact.firstNamePlaceholder')}
                        />
                      </div>
                      {formErrors.firstName && (
                        <p id="error-contact-firstName" role="alert" className="text-sm text-red-600 dark:text-red-400 mt-1">{formErrors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="field-contact-lastName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t('contact.lastName')} *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          id="field-contact-lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          aria-required="true"
                          aria-describedby={formErrors.lastName ? 'error-contact-lastName' : undefined}
                          className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-600 transition-colors duration-200 ${
                            formErrors.lastName
                              ? 'border-red-300 focus:border-red-500'
                              : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                          }`}
                          placeholder={t('contact.lastNamePlaceholder')}
                        />
                      </div>
                      {formErrors.lastName && (
                        <p id="error-contact-lastName" role="alert" className="text-sm text-red-600 dark:text-red-400 mt-1">{formErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label htmlFor="field-contact-email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('contact.emailAddress')} *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <input
                        id="field-contact-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        aria-required="true"
                        aria-describedby={formErrors.email ? 'error-contact-email' : undefined}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-600 transition-colors duration-200 ${
                          formErrors.email
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                        }`}
                        placeholder={t('contact.emailPlaceholder')}
                      />
                    </div>
                    {formErrors.email && (
                      <p id="error-contact-email" role="alert" className="text-sm text-red-600 dark:text-red-400 mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div>
                    <label htmlFor="field-contact-phone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('contact.phoneNumber')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <input
                        id="field-contact-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-600 transition-colors duration-200 border-gray-200 dark:border-gray-600 focus:border-blue-500"
                        placeholder={t('contact.phonePlaceholder')}
                      />
                    </div>
                  </div>

                  {/* Subject Field */}
                  <div>
                    <label htmlFor="field-contact-subject" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('contact.subject')} *
                    </label>
                    <select
                      id="field-contact-subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      aria-required="true"
                      aria-label="Asunto del mensaje"
                      aria-describedby={formErrors.subject ? 'error-contact-subject' : undefined}
                      className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-gray-600 transition-colors duration-200 ${
                        formErrors.subject
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                      }`}
                    >
                      <option value="">{t('contact.subjectPlaceholder')}</option>
                      {subjectOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.subject && (
                      <p id="error-contact-subject" role="alert" className="text-sm text-red-600 dark:text-red-400 mt-1">{formErrors.subject}</p>
                    )}
                  </div>

                  {/* Message Field */}
                  <div>
                    <label htmlFor="field-contact-message" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('contact.message')} *
                    </label>
                    <textarea
                      id="field-contact-message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      rows={5}
                      aria-required="true"
                      aria-describedby={formErrors.message ? 'error-contact-message' : undefined}
                      className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-600 transition-colors duration-200 resize-none ${
                        formErrors.message
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                      }`}
                      placeholder={t('contact.messagePlaceholder')}
                    />
                    {formErrors.message && (
                      <p id="error-contact-message" role="alert" className="text-sm text-red-600 dark:text-red-400 mt-1">{formErrors.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    ) : (
                      <Send className="w-5 h-5" aria-hidden="true" />
                    )}
                    <span>
                      {isSubmitting ? t('general.loading') : t('contact.sendMessageBtn')}
                    </span>
                  </button>
                </form>
              </div>
            </div>

            {/* Contact Information Sidebar */}
            <div className="space-y-8">
              {/* Contact Cards */}
              <div className="space-y-4">
                <h3 id="contact-sidebar-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {t('contact.otherWays')}
                </h3>

                {/* Phone Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
                      <Phone className="w-6 h-6 text-white" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                        {t('contact.callUs')}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                        {t('contact.availableSupport')}
                      </p>
                      <button
                        onClick={handleCallClick}
                        className="text-green-600 dark:text-green-400 font-semibold hover:underline"
                      >
                        {t('contact.contactPhone')}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Email Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                      <Mail className="w-6 h-6 text-white" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                        {t('contact.emailUs')}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                        {t('contact.responseTime')}
                      </p>
                      <button
                        onClick={handleEmailClick}
                        className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                      >
                        {t('contact.contactEmail')}
                      </button>
                    </div>
                  </div>
                </div>


              </div>

              {/* Additional Info */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" aria-hidden="true" />
                  {t('contact.businessHours')}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">{t('contact.mondayFriday')}</span>
                    <span className="text-gray-900 dark:text-white font-medium">{t('contact.businessHours9to6')}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section aria-labelledby="contact-faq-heading" className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 id="contact-faq-heading" className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white text-center mb-12">
              {t('contact.frequentlyAskedQuestions')}
            </h2>

            <div className="space-y-4">
              {faqItems.map((item) => (
                <div key={item.id} className="bg-gray-50 dark:bg-gray-700 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-600">
                  <button
                    id={`contact-faq-trigger-${item.id}`}
                    onClick={() => toggleFAQ(item.id)}
                    aria-expanded={expandedFAQ === item.id}
                    aria-controls={`contact-faq-panel-${item.id}`}
                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    <span className="font-semibold text-gray-900 dark:text-white pr-4">
                      {item.question}
                    </span>
                    <div className={`transform transition-transform duration-200 ${
                      expandedFAQ === item.id ? 'rotate-180' : ''
                    }`}>
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {expandedFAQ === item.id && (
                    <div id={`contact-faq-panel-${item.id}`} role="region" aria-labelledby={`contact-faq-trigger-${item.id}`} className="px-6 pb-4">
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}