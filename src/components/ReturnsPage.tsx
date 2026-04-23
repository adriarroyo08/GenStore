import React from 'react';
import { ArrowLeft, RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ReturnsPageProps {
  onBackToHome: () => void;
  onContactClick: () => void;
}

export function ReturnsPage({ onBackToHome, onContactClick }: ReturnsPageProps) {
  const { t } = useLanguage();

  return (
    <section aria-labelledby="returns-heading" className="min-h-screen bg-gray-50 dark:bg-gray-900">


      {/* Hero Section */}
      <div className="bg-green-600 dark:bg-green-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <RotateCcw className="w-16 h-16 mx-auto mb-6 text-green-200 dark:text-green-300" aria-hidden="true" />
            <h1 id="returns-heading" className="text-4xl md:text-5xl font-bold mb-6">{t('returns.title')}</h1>
            <p className="text-xl text-green-100 dark:text-green-200">
              {t('returns.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Return Process */}
        <section aria-labelledby="returns-process-heading" className="max-w-4xl mx-auto mb-16">
          <h2 id="returns-process-heading" className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">{t('returns.howItWorks')}</h2>
          <ol className="grid grid-cols-1 md:grid-cols-4 gap-8 list-none p-0">
            <li className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('returns.step1')}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('returns.step1Description')}</p>
            </li>

            <li className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('returns.step2')}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('returns.step2Description')}</p>
            </li>

            <li className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('returns.step3')}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('returns.step3Description')}</p>
            </li>

            <li className="text-center">
              <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('returns.step4')}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('returns.step4Description')}</p>
            </li>
          </ol>
        </section>

        {/* Return Policy */}
        <section aria-labelledby="returns-policy-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-16">
          <h2 id="returns-policy-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-8">{t('returns.policyTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('returns.whatCanReturn')}</h3>
              </div>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• {t('returns.eligibleItem1')}</li>
                <li>• {t('returns.eligibleItem2')}</li>
                <li>• {t('returns.eligibleItem3')}</li>
                <li>• {t('returns.eligibleItem4')}</li>
              </ul>
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('returns.whatCannotReturn')}</h3>
              </div>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• {t('returns.ineligibleItem1')}</li>
                <li>• {t('returns.ineligibleItem2')}</li>
                <li>• {t('returns.ineligibleItem3')}</li>
                <li>• {t('returns.ineligibleItem4')}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Time Frames */}
        <section aria-labelledby="returns-timeframes-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-16">
          <h2 id="returns-timeframes-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-8">{t('returns.timeFrames')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Clock aria-hidden="true" className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('returns.standardReturn')}</h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">{t('returns.days')}</p>
              <p className="text-gray-600 dark:text-gray-300">{t('returns.standardDescription')}</p>
            </div>
            
            <div className="text-center">
              <Clock aria-hidden="true" className="w-12 h-12 mx-auto mb-4 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('returns.extendedReturn')}</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">{t('returns.extendedDays')}</p>
              <p className="text-gray-600 dark:text-gray-300">{t('returns.extendedDescription')}</p>
            </div>
            
            <div className="text-center">
              <Clock aria-hidden="true" className="w-12 h-12 mx-auto mb-4 text-yellow-600 dark:text-yellow-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('returns.defectiveReturn')}</h3>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">1 {t('returns.year')}</p>
              <p className="text-gray-600 dark:text-gray-300">{t('returns.defectiveDescription')}</p>
            </div>
          </div>
        </section>

        {/* Refund Information */}
        <section aria-labelledby="returns-refund-heading" className="max-w-4xl mx-auto">
          <h2 id="returns-refund-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-8">{t('returns.refundInfo')}</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('returns.refundMethod')}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('returns.refundMethodDescription')}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('returns.refundTime')}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('returns.refundTimeDescription')}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('returns.returnShipping')}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('returns.returnShippingDescription')}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('returns.exchanges')}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t('returns.exchangesDescription')}</p>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('returns.needHelp')}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">{t('returns.contactDescription')}</p>
          <button
            onClick={onContactClick}
            className="bg-green-600 dark:bg-green-700 text-white px-8 py-3 rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition-colors font-medium"
          >
            {t('contact.contactUs')}
          </button>
        </div>
      </div>
    </section>
  );
}