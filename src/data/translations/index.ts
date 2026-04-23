// This file is now deprecated - translations moved to LanguageContext for better reliability
// All translations are now embedded directly in the LanguageContext to avoid import issues

export type Language = 'en' | 'es';

// Empty fallback to prevent import errors
export const translations: Record<Language, any> = {
  en: {},
  es: {}
};

console.log('⚠️ Warning: Using deprecated translations index. Please use LanguageContext directly.');