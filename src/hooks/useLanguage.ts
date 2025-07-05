// Updated src/hooks/useLanguage.ts
import { useTranslation } from 'react-i18next';
import { useCallback, useMemo } from 'react';
import { LanguageCode, SUPPORTED_LANGUAGES } from '../locales/i18n';

export const useLanguage = () => {
  const { i18n, t } = useTranslation();

  const currentLanguage = useMemo(() => {
    return i18n.language as LanguageCode;
  }, [i18n.language]);

  const currentLanguageInfo = useMemo(() => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
  }, [currentLanguage]);

  const changeLanguage = useCallback(async (languageCode: LanguageCode) => {
    try {
      await i18n.changeLanguage(languageCode);
      // Store in localStorage for persistence
      localStorage.setItem('crazy-fox-language', languageCode);
      
      // Announce language change for screen readers
      const message = t('common.languageChanged', { 
        defaultValue: `Language changed to ${SUPPORTED_LANGUAGES.find(l => l.code === languageCode)?.name}` 
      });
      
      // Create an announcement for accessibility
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.style.position = 'absolute';
      announcement.style.left = '-10000px';
      announcement.style.width = '1px';
      announcement.style.height = '1px';
      announcement.style.overflow = 'hidden';
      announcement.textContent = message;
      
      document.body.appendChild(announcement);
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('Failed to change language:', error);
      return false;
    }
  }, [i18n, t]);

  const isLanguageLoading = useMemo(() => {
    return !i18n.isInitialized;
  }, [i18n.isInitialized]);

  // Helper function to get text with fallback
  const getText = useCallback((key: string, fallback?: string) => {
    return t(key, fallback || key);
  }, [t]);

  // Helper function for component-specific translations
  const getComponentText = useCallback((component: string, key: string, fallback?: string) => {
    return t(`${component}.${key}`, fallback || key);
  }, [t]);

  // Helper function to get multiple features/items as array
  const getComponentArray = useCallback((component: string, baseKey: string, count: number = 5) => {
    const items: string[] = [];
    for (let i = 1; i <= count; i++) {
      const item = t(`${component}.${baseKey}.feature${i}`, '');
      if (item && item !== `${component}.${baseKey}.feature${i}`) {
        items.push(item);
      }
    }
    return items;
  }, [t]);

  // NEW: Helper function to get arrays directly from translations (for objectives, etc.)
  const getComponentObjectArray = useCallback((component: string, key: string, fallback?: string[]): string[] => {
    const result = t(`${component}.${key}`, { returnObjects: true });
    
    // If it's already an array, check if all elements are strings
    if (Array.isArray(result)) {
      // Filter out non-string elements and ensure we return string[]
      const stringArray = result.filter((item): item is string => typeof item === 'string');
      return stringArray.length > 0 ? stringArray : fallback || [];
    }
    
    // If it's a string and looks like a translation key, return fallback
    if (typeof result === 'string' && result === `${component}.${key}`) {
      return fallback || [];
    }
    
    // If it's an object (like objectives), convert to array
    if (typeof result === 'object' && result !== null) {
      const values = Object.values(result);
      const stringValues = values.filter((item): item is string => typeof item === 'string');
      return stringValues.length > 0 ? stringValues : fallback || [];
    }
    
    // Fallback
    return fallback || [];
  }, [t]);

  return {
    currentLanguage,
    currentLanguageInfo,
    supportedLanguages: SUPPORTED_LANGUAGES,
    changeLanguage,
    isLanguageLoading,
    getText,
    getComponentText,
    getComponentArray,
    getComponentObjectArray, // NEW method for getting arrays
    t // Direct access to translation function
  };
};