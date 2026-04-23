import React, { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { Zap, Heart, Sparkles, Waves, Info, Mail, HelpCircle, MessageCircle, Truck, RotateCcw, Shield, FileText, Instagram, Facebook, Twitter } from "lucide-react";
import { GenStoreLogo } from "./GenStoreLogo";

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
    fetch('/api/v1/settings/public')
      .then((r) => r.json())
      .then((data) => setBusinessInfo({
        razon_social: data.razon_social ?? '',
        cif: data.cif ?? '',
      }))
      .catch(() => {});
  }, []);

  const categoryIcons = {
    electrotherapy: Zap,
    massage: Heart,
    skincare: Sparkles,
    "beauty-tech": Waves
  };

  const quickLinksIcons = {
    about: Info,
    contact: Mail,
    support: HelpCircle,
    faq: MessageCircle
  };

  const serviceIcons = {
    shipping: Truck,
    returns: RotateCcw,
    privacy: Shield,
    terms: FileText
  };

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <div className="absolute top-10 left-10 w-32 h-32 bg-violet-500 rounded-full blur-3xl"></div>
        <div className="absolute top-32 right-20 w-24 h-24 bg-indigo-500 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-violet-600 rounded-full blur-3xl"></div>
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-20">
        <div className="flex flex-col gap-8 sm:gap-12 lg:gap-16 max-w-7xl mx-auto">
          
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">
            
            {/* Brand Section */}
            <div className="md:col-span-2 lg:col-span-1">
              <button
                onClick={onHomeClick}
                aria-label="Ir a inicio - GenStore"
                className="flex items-center gap-3 mb-6 group transition-all duration-300 hover:opacity-80"
              >
                <GenStoreLogo size={44} showText textVariant="light" textClassName="text-2xl" />
              </button>
              <div className="text-gray-300 leading-relaxed max-w-sm mb-6">
                {t("footer.trustedPartner")}
              </div>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 bg-gray-700/50 rounded-lg flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 transition-all duration-300 cursor-pointer group"
                >
                  <Instagram className="w-5 h-5 group-hover:text-white transition-colors duration-300" aria-hidden="true" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-10 h-10 bg-gray-700/50 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-300 cursor-pointer group"
                >
                  <Facebook className="w-5 h-5 group-hover:text-white transition-colors duration-300" aria-hidden="true" />
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  className="w-10 h-10 bg-gray-700/50 rounded-lg flex items-center justify-center hover:bg-black transition-colors duration-300 cursor-pointer group"
                >
                  <Twitter className="w-5 h-5 group-hover:text-white transition-colors duration-300" aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <nav aria-label="Enlaces rápidos">
              <div className="font-semibold text-lg text-white mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full" aria-hidden="true"></div>
                {t("footer.quickLinks")}
              </div>
              <div className="space-y-4">
                {[
                  { key: 'general.about', onClick: onAboutClick, icon: quickLinksIcons.about },
                  { key: 'nav.contact', onClick: onContactClick, icon: quickLinksIcons.contact },
                  { key: 'general.support', onClick: onSupportClick, icon: quickLinksIcons.support },
                  { key: 'general.faq', onClick: onFAQClick, icon: quickLinksIcons.faq }
                ].map(({ key, onClick, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={onClick}
                    className="group flex items-center gap-3 text-gray-300 hover:text-white transition-all duration-300 text-left w-full min-h-[44px] py-1.5 text-sm"
                  >
                    <div className="w-8 h-8 bg-gray-700/30 rounded-lg flex items-center justify-center group-hover:bg-emerald-600/20 transition-colors duration-300">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      {t(key)}
                    </span>
                  </button>
                ))}
              </div>
            </nav>

            {/* Categories */}
            <nav aria-label="Comprar por categoría">
              <div className="font-semibold text-lg text-white mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-teal-400 to-teal-600 rounded-full" aria-hidden="true"></div>
                {t("categories.title")}
              </div>
              <div className="space-y-4">
                {[
                  { key: 'categories.electrotherapy', category: 'electrotherapy', icon: categoryIcons.electrotherapy },
                  { key: 'categories.massage', category: 'massage', icon: categoryIcons.massage },
                  { key: 'categories.skincare', category: 'skincare', icon: categoryIcons.skincare },
                  { key: 'categories.beautyTech', category: 'beauty-tech', icon: categoryIcons["beauty-tech"] }
                ].map(({ key, category, icon: Icon }) => (
                  <button
                    key={category}
                    onClick={() => onCategoryClick?.(category)}
                    className="group flex items-center gap-3 text-gray-300 hover:text-white transition-all duration-300 text-left w-full min-h-[44px] py-1.5 text-sm"
                  >
                    <div className="w-8 h-8 bg-gray-700/30 rounded-lg flex items-center justify-center group-hover:bg-teal-600/20 transition-colors duration-300">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      {t(key)}
                    </span>
                  </button>
                ))}
              </div>
            </nav>

            {/* Customer Service */}
            <nav aria-label="Atención al cliente">
              <div className="font-semibold text-lg text-white mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full" aria-hidden="true"></div>
                {t("footer.customerService")}
              </div>
              <div className="space-y-4">
                {[
                  { key: 'footer.shipping', onClick: onShippingInfoClick, icon: serviceIcons.shipping },
                  { key: 'footer.returns', onClick: onReturnsClick, icon: serviceIcons.returns },
                  { key: 'footer.privacy', onClick: onPrivacyClick, icon: serviceIcons.privacy },
                  { key: 'footer.terms', onClick: onTermsClick, icon: serviceIcons.terms }
                ].map(({ key, onClick, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={onClick}
                    className="group flex items-center gap-3 text-gray-300 hover:text-white transition-all duration-300 text-left w-full min-h-[44px] py-1.5 text-sm"
                  >
                    <div className="w-8 h-8 bg-gray-700/30 rounded-lg flex items-center justify-center group-hover:bg-cyan-600/20 transition-colors duration-300">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      {t(key)}
                    </span>
                  </button>
                ))}
              </div>
            </nav>
          </div>

          {/* Divider with gradient */}
          <div className="relative" aria-hidden="true">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
            </div>
            <div className="relative flex justify-center">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-2 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mx-auto animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Copyright Section */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-gray-400 bg-gray-800/30 rounded-full px-6 py-3 backdrop-blur-sm border border-gray-700/50">
              <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full" aria-hidden="true"></div>
              <span>
                © {currentYear} {businessInfo.razon_social || 'GenStore'}. {t("footer.allRightsReserved")}
                {businessInfo.cif && <> · CIF: {businessInfo.cif}</>}
              </span>
              <div className="w-2 h-2 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full" aria-hidden="true"></div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}