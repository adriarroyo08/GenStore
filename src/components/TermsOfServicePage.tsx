import React from 'react';
import { FileText, Scale, AlertTriangle, Users, CreditCard, Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface TermsOfServicePageProps {
  onBackToHome: () => void;
  onContactClick: () => void;
}

export function TermsOfServicePage({ onBackToHome, onContactClick }: TermsOfServicePageProps) {
  const { t } = useLanguage();
  const currentDate = '2025-01-15';

  return (
    <section aria-labelledby="terms-heading" className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gray-800 dark:bg-gray-950 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <Scale className="w-16 h-16 mx-auto mb-6 text-gray-400 dark:text-gray-500" aria-hidden="true" />
            <h1 id="terms-heading" className="text-4xl md:text-5xl font-bold mb-6">{t('termsOfService.title')}</h1>
            <p className="text-xl text-gray-300 dark:text-gray-400">
              {t('termsOfService.subtitle')}
            </p>
            <div className="mt-4 text-sm text-gray-400 dark:text-gray-500">
              {t('termsOfService.lastUpdated')}: {currentDate}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Agreement */}
          <section aria-labelledby="terms-agreement-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <h2 id="terms-agreement-heading" className="text-2xl font-bold text-gray-900 dark:text-white">{t('termsOfService.agreementTitle')}</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              {t('termsOfService.agreementP1')}
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-4">
              <p className="text-blue-800 dark:text-blue-200">
                <strong>{t('termsOfService.agreementImportant')}</strong>
              </p>
            </div>
          </section>

          {/* Purchase Conditions */}
          <section aria-labelledby="terms-purchase-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
              <h2 id="terms-purchase-heading" className="text-2xl font-bold text-gray-900 dark:text-white">{t('termsOfService.purchaseTitle')}</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('termsOfService.productInfoTitle')}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {t('termsOfService.productInfoP1')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('termsOfService.pricingTitle')}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {t('termsOfService.pricingP1')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('termsOfService.ordersTitle')}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {t('termsOfService.ordersP1')}
                </p>
              </div>
            </div>
          </section>

          {/* Payment */}
          <section aria-labelledby="terms-payment-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              <h2 id="terms-payment-heading" className="text-2xl font-bold text-gray-900 dark:text-white">{t('termsOfService.paymentTitle')}</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('termsOfService.paymentP1')}
            </p>
          </section>

          {/* Shipping */}
          <section aria-labelledby="terms-shipping-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Truck className="w-6 h-6 text-teal-600 dark:text-teal-400" aria-hidden="true" />
              <h2 id="terms-shipping-heading" className="text-2xl font-bold text-gray-900 dark:text-white">{t('termsOfService.shippingTitle')}</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('termsOfService.shippingP1')}
            </p>
          </section>

          {/* Right of Withdrawal */}
          <section aria-labelledby="terms-withdrawal-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <RotateCcw className="w-6 h-6 text-orange-600 dark:text-orange-400" aria-hidden="true" />
              <h2 id="terms-withdrawal-heading" className="text-2xl font-bold text-gray-900 dark:text-white">{t('termsOfService.withdrawalTitle')}</h2>
            </div>
            <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">
              <p>{t('termsOfService.withdrawalP1')}</p>
              <p>{t('termsOfService.withdrawalP2')}</p>
              <p>{t('termsOfService.withdrawalP3')}</p>
            </div>
          </section>

          {/* Warranties */}
          <section aria-labelledby="terms-warranty-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <h2 id="terms-warranty-heading" className="text-2xl font-bold text-gray-900 dark:text-white">{t('termsOfService.warrantyTitle')}</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('termsOfService.warrantyP1')}
            </p>
          </section>

          {/* User Accounts */}
          <section aria-labelledby="terms-accounts-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <h2 id="terms-accounts-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('termsOfService.accountsTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              {t('termsOfService.accountsP1')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('termsOfService.responsibilitiesTitle')}</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li>• {t('termsOfService.responsibilityItem1')}</li>
                  <li>• {t('termsOfService.responsibilityItem2')}</li>
                  <li>• {t('termsOfService.responsibilityItem3')}</li>
                  <li>• {t('termsOfService.responsibilityItem4')}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('termsOfService.accountTermTitle')}</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li>• {t('termsOfService.accountTermItem1')}</li>
                  <li>• {t('termsOfService.accountTermItem2')}</li>
                  <li>• {t('termsOfService.accountTermItem3')}</li>
                  <li>• {t('termsOfService.accountTermItem4')}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section aria-labelledby="terms-liability-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
              <h2 id="terms-liability-heading" className="text-2xl font-bold text-gray-900 dark:text-white">{t('termsOfService.liabilityTitle')}</h2>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 mb-6">
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                {t('termsOfService.liabilityWarning')}
              </p>
            </div>

            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('termsOfService.liabilityP1')}
            </p>
          </section>

          {/* Governing Law */}
          <section aria-labelledby="terms-law-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <h2 id="terms-law-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('termsOfService.governingLawTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              {t('termsOfService.governingLawP1')}
            </p>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('termsOfService.governingLawP2')}
            </p>
          </section>

          {/* Contact Information */}
          <section aria-labelledby="terms-contact-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <h2 id="terms-contact-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('termsOfService.contactTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              {t('termsOfService.contactP1')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('termsOfService.legalDepartment')}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  <a href={`mailto:${t('privacyPolicy.controllerEmail')}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                    {t('privacyPolicy.controllerEmail')}
                  </a>
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('contact.contactUs')}</h3>
                <button
                  onClick={onContactClick}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  {t('contact.contactUs')}
                </button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t('termsOfService.updateNotice')}
              </p>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
