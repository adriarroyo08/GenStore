import React, { createContext, useContext, useState, ReactNode } from 'react';
import { en } from '../data/translations/en';
import { es } from '../data/translations/es';

export type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

// Import translations from external files - updated for payment support
const translations: Record<Language, any> = {
  en,
  es
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize language with localStorage and browser detection
  const [language, setLanguage] = useState<Language>(() => {
    // Check localStorage first
    const savedLanguage = localStorage.getItem('genstore-language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
      return savedLanguage;
    }
    
    // Fallback to browser language detection
    const browserLanguage = navigator.language.toLowerCase();
    if (browserLanguage.startsWith('es')) {
      return 'es';
    }
    
    // Default to English
    return 'en';
  });

  // Enhanced setLanguage with persistence
  const handleSetLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('genstore-language', newLanguage);
  };

  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // More detailed warning with context
        console.warn(`🌐 [i18n] Missing translation: "${key}" for language "${language}". Using key as fallback.`);
        return key;
      }
    }
    
    if (typeof value === 'string') {
      if (params) {
        return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
          return params[param] || match;
        });
      }
      return value;
    }
    
    // Enhanced warning for non-string values
    console.warn(`🌐 [i18n] Translation "${key}" for language "${language}" is not a string. Type: ${typeof value}. Using key as fallback.`);
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}