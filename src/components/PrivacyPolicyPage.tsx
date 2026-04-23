import React from 'react';
import { Shield, Eye, Lock, Users, Cookie, Database, Scale } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface PrivacyPolicyPageProps {
  onBackToHome: () => void;
  onContactClick: () => void;
}

export function PrivacyPolicyPage({ onBackToHome, onContactClick }: PrivacyPolicyPageProps) {
  const { t } = useLanguage();
  const currentDate = '2025-01-15';

  const rights = [
    { key: 'rightAccess', descKey: 'rightAccessDesc', border: 'border-blue-500 dark:border-blue-400' },
    { key: 'rightRectification', descKey: 'rightRectificationDesc', border: 'border-green-500 dark:border-green-400' },
    { key: 'rightErasure', descKey: 'rightErasureDesc', border: 'border-yellow-500 dark:border-yellow-400' },
    { key: 'rightPortability', descKey: 'rightPortabilityDesc', border: 'border-purple-500 dark:border-purple-400' },
    { key: 'rightOpposition', descKey: 'rightOppositionDesc', border: 'border-red-500 dark:border-red-400' },
    { key: 'rightLimitation', descKey: 'rightLimitationDesc', border: 'border-orange-500 dark:border-orange-400' },
  ];

  return (
    <section aria-labelledby="privacy-heading" className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* Hero Section */}
      <div className="bg-purple-600 dark:bg-purple-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <Shield className="w-16 h-16 mx-auto mb-6 text-purple-200 dark:text-purple-300" aria-hidden="true" />
            <h1 id="privacy-heading" className="text-4xl md:text-5xl font-bold mb-6">{t('privacyPolicy.title')}</h1>
            <p className="text-xl text-purple-100 dark:text-purple-200">
              {t('privacyPolicy.subtitle')}
            </p>
            <div className="mt-4 text-sm text-purple-200 dark:text-purple-300">
              {t('privacyPolicy.lastUpdated')}: {currentDate}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Overview */}
          <section aria-labelledby="privacy-overview-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <h2 id="privacy-overview-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('privacyPolicy.overviewTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              {t('privacyPolicy.overviewP1')}
            </p>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('privacyPolicy.overviewP2')}
            </p>
          </section>

          {/* Data Controller */}
          <section aria-labelledby="privacy-controller-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <h2 id="privacy-controller-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('privacyPolicy.controllerTitle')}</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-300">
              <p><strong className="text-gray-900 dark:text-white">{t('privacyPolicy.controllerName')}</strong></p>
              <p>{t('privacyPolicy.controllerPurpose')}</p>
              <p>Email: <a href={`mailto:${t('privacyPolicy.controllerEmail')}`} className="text-purple-600 dark:text-purple-400 hover:underline">{t('privacyPolicy.controllerEmail')}</a></p>
            </div>
          </section>

          {/* Data Collection */}
          <section aria-labelledby="privacy-collect-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <h2 id="privacy-collect-heading" className="text-2xl font-bold text-gray-900 dark:text-white">{t('privacyPolicy.dataCollection')}</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('privacyPolicy.personalInfo')}</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• {t('privacyPolicy.personalItem1')}</li>
                  <li>• {t('privacyPolicy.personalItem2')}</li>
                  <li>• {t('privacyPolicy.personalItem3')}</li>
                  <li>• {t('privacyPolicy.personalItem4')}</li>
                  <li>• {t('privacyPolicy.personalItem5')}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('privacyPolicy.autoInfo')}</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                  <li>• {t('privacyPolicy.autoItem1')}</li>
                  <li>• {t('privacyPolicy.autoItem2')}</li>
                  <li>• {t('privacyPolicy.autoItem3')}</li>
                  <li>• {t('privacyPolicy.autoItem4')}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Use */}
          <section aria-labelledby="privacy-use-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
              <h2 id="privacy-use-heading" className="text-2xl font-bold text-gray-900 dark:text-white">{t('privacyPolicy.dataUse')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('privacyPolicy.serviceProvision')}</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li>• {t('privacyPolicy.serviceItem1')}</li>
                  <li>• {t('privacyPolicy.serviceItem2')}</li>
                  <li>• {t('privacyPolicy.serviceItem3')}</li>
                  <li>• {t('privacyPolicy.serviceItem4')}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('privacyPolicy.improvements')}</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li>• {t('privacyPolicy.improvementItem1')}</li>
                  <li>• {t('privacyPolicy.improvementItem2')}</li>
                  <li>• {t('privacyPolicy.improvementItem3')}</li>
                  <li>• {t('privacyPolicy.improvementItem4')}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Legal Basis */}
          <section aria-labelledby="privacy-legal-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Scale className="w-6 h-6 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              <h2 id="privacy-legal-heading" className="text-2xl font-bold text-gray-900 dark:text-white">{t('privacyPolicy.legalBasisTitle')}</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('privacyPolicy.legalBasisP1')}
            </p>
          </section>

          {/* Data Security */}
          <section aria-labelledby="privacy-security-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-6 h-6 text-red-600 dark:text-red-400" aria-hidden="true" />
              <h2 id="privacy-security-heading" className="text-2xl font-bold text-gray-900 dark:text-white">{t('privacyPolicy.dataSecurity')}</h2>
            </div>

            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              {t('privacyPolicy.securityP1')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• {t('privacyPolicy.securityItem1')}</li>
                <li>• {t('privacyPolicy.securityItem2')}</li>
                <li>• {t('privacyPolicy.securityItem3')}</li>
              </ul>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• {t('privacyPolicy.securityItem4')}</li>
                <li>• {t('privacyPolicy.securityItem5')}</li>
                <li>• {t('privacyPolicy.securityItem6')}</li>
              </ul>
            </div>
          </section>

          {/* Your Rights (ARCO+) */}
          <section aria-labelledby="privacy-rights-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <h2 id="privacy-rights-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('privacyPolicy.yourRights')}</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              {t('privacyPolicy.rightsP1')}
            </p>

            <div className="space-y-4">
              {rights.map(({ key, descKey, border }) => (
                <div key={key} className={`border-l-4 ${border} pl-4`}>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t(`privacyPolicy.${key}`)}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{t(`privacyPolicy.${descKey}`)}</p>
                </div>
              ))}
            </div>

            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-6">
              {t('privacyPolicy.rightsExercise')}
            </p>
          </section>

          {/* Cookies */}
          <section aria-labelledby="privacy-cookies-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Cookie className="w-6 h-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <h2 id="privacy-cookies-heading" className="text-2xl font-bold text-gray-900 dark:text-white">{t('privacyPolicy.cookies')}</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('privacyPolicy.cookiesP1')}
            </p>
          </section>

          {/* Data Retention */}
          <section aria-labelledby="privacy-retention-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-6 h-6 text-teal-600 dark:text-teal-400" aria-hidden="true" />
              <h2 id="privacy-retention-heading" className="text-2xl font-bold text-gray-900 dark:text-white">{t('privacyPolicy.retentionTitle')}</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('privacyPolicy.retentionP1')}
            </p>
          </section>

          {/* Contact Information */}
          <section aria-labelledby="privacy-contact-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <h2 id="privacy-contact-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('privacyPolicy.contactUs')}</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              {t('privacyPolicy.contactP1')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('privacyPolicy.privacyOfficer')}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  <a href={`mailto:${t('privacyPolicy.controllerEmail')}`} className="text-purple-600 dark:text-purple-400 hover:underline">
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
                {t('privacyPolicy.updateNotice')}
              </p>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
