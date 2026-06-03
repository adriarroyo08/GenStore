import React, { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { Instagram, Facebook, Twitter } from "lucide-react";
import { GenStoreLogo } from "./GenStoreLogo";
import { apiClient } from "../lib/apiClient";

interface FooterProps {
  onAboutClick?: () => void;
  onContactClick?: () => void;
  onSupportClick?: () => void;
  onFAQClick?: () => void;
  onCategoryClick?: (category: string) => void;
  onShippingInfoClick?: () => void;
  onReturnsClick?: () => void;
  onPrivacyClick?: () => void;
  onTermsClick?: () => void;
  onHomeClick?: () => void;
}

export function Footer({
  onAboutClick,
  onContactClick,
  onSupportClick,
  onFAQClick,
  onCategoryClick,
  onShippingInfoClick,
  onReturnsClick,
  onPrivacyClick,
  onTermsClick,
  onHomeClick,
}: FooterProps) {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const [businessInfo, setBusinessInfo] = useState({ razon_social: '', cif: '' });

  useEffect(() => {
    apiClient.get('/settings/public')
      .then((data) => setBusinessInfo({
        razon_social: data.razon_social ?? '',
        cif: data.cif ?? '',
      }))
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-neutral-950 text-neutral-300">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          {/* Brand */}
          <div>
            <button onClick={onHomeClick} className="flex items-center gap-2.5 mb-5 hover:opacity-80 transition-opacity">
              <GenStoreLogo size={36} showText textVariant="light" textClassName="text-xl" />
            </button>
            <p className="text-neutral-400 text-sm leading-relaxed mb-6 max-w-xs">
              {t('footer.trustedPartner')}
            </p>
            <div className="flex gap-3">
              {[
                { href: 'https://instagram.com', label: 'Instagram', Icon: Instagram },
                { href: 'https://facebook.com', label: 'Facebook', Icon: Facebook },
                { href: 'https://x.com', label: 'Twitter', Icon: Twitter },
              ].map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-blue-600 transition-all duration-200">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <nav aria-label="Comprar">
            <h3 className="text-white text-sm font-semibold uppercase tracking-widest mb-5">{t('categories.title')}</h3>
            <div className="space-y-3">
              {['electrotherapy', 'massage', 'skincare', 'beauty-tech'].map((cat) => (
                <button key={cat} onClick={() => onCategoryClick?.(cat)}
                  className="block text-sm text-neutral-400 hover:text-white transition-colors">
                  {t(`categories.${cat === 'beauty-tech' ? 'beautyTech' : cat}`)}
                </button>
              ))}
            </div>
          </nav>

          {/* Support */}
          <nav aria-label="Soporte">
            <h3 className="text-white text-sm font-semibold uppercase tracking-widest mb-5">{t('footer.customerService')}</h3>
            <div className="space-y-3">
              {[
                { key: 'footer.shipping', onClick: onShippingInfoClick },
                { key: 'footer.returns', onClick: onReturnsClick },
                { key: 'general.support', onClick: onSupportClick },
                { key: 'general.faq', onClick: onFAQClick },
              ].map(({ key, onClick }) => (
                <button key={key} onClick={onClick} className="block text-sm text-neutral-400 hover:text-white transition-colors">
                  {t(key)}
                </button>
              ))}
            </div>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal">
            <h3 className="text-white text-sm font-semibold uppercase tracking-widest mb-5">Legal</h3>
            <div className="space-y-3">
              {[
                { key: 'general.about', onClick: onAboutClick },
                { key: 'nav.contact', onClick: onContactClick },
                { key: 'footer.privacy', onClick: onPrivacyClick },
                { key: 'footer.terms', onClick: onTermsClick },
              ].map(({ key, onClick }) => (
                <button key={key} onClick={onClick} className="block text-sm text-neutral-400 hover:text-white transition-colors">
                  {t(key)}
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Bottom */}
        <div className="border-t border-neutral-800 mt-14 pt-8 text-center text-sm text-neutral-500">
          © {currentYear} {businessInfo.razon_social || 'GenStore'}. {t('footer.allRightsReserved')}
          {businessInfo.cif && <> · CIF: {businessInfo.cif}</>}
        </div>
      </div>
    </footer>
  );
}