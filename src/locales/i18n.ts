// Updated src/locales/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import component locales
import { headerLocale as headerEn } from './components/Header/en';
import { headerLocale as headerRu } from './components/Header/ru';
import { headerLocale as headerZh } from './components/Header/zh';

import { heroSectionLocale as heroEn } from './components/HeroSection/en';
import { heroSectionLocale as heroRu } from './components/HeroSection/ru';
import { heroSectionLocale as heroZh } from './components/HeroSection/zh';

import { crazyAboutLocale as crazyAboutEn } from './components/CrazyAbout/en';
import { crazyAboutLocale as crazyAboutRu } from './components/CrazyAbout/ru';
import { crazyAboutLocale as crazyAboutZh } from './components/CrazyAbout/zh';

import { tokenPriceProgressionLocale as tokenPriceProgressionEn } from './components/TokenPriceProgression/en';
import { tokenPriceProgressionLocale as tokenPriceProgressionRu } from './components/TokenPriceProgression/ru';
import { tokenPriceProgressionLocale as tokenPriceProgressionZh } from './components/TokenPriceProgression/zh';

import { crazyTokenomicsLocale as crazyTokenomicsEn } from './components/CrazyTokenomics/en';
import { crazyTokenomicsLocale as crazyTokenomicsRu } from './components/CrazyTokenomics/ru';
import { crazyTokenomicsLocale as crazyTokenomicsZh } from './components/CrazyTokenomics/zh';

import { crazyFoxSpaceRoadmapLocale as crazyFoxSpaceRoadmapEn } from './components/CrazyFoxSpaceRoadmap/en';
import { crazyFoxSpaceRoadmapLocale as crazyFoxSpaceRoadmapRu } from './components/CrazyFoxSpaceRoadmap/ru';
import { crazyFoxSpaceRoadmapLocale as crazyFoxSpaceRoadmapZh } from './components/CrazyFoxSpaceRoadmap/zh';

import { crazyCommunityLocale as crazyCommunityEn } from './components/CrazyCommunity/en';
import { crazyCommunityLocale as crazyCommunityRu } from './components/CrazyCommunity/ru';
import { crazyCommunityLocale as crazyCommunityZh } from './components/CrazyCommunity/zh';

import { footerLocale as footerEn } from './components/Footer/en';
import { footerLocale as footerRu } from './components/Footer/ru';
import { footerLocale as footerZh } from './components/Footer/zh';

import { wagmiPresalePurchaseLocale as wagmiPresalePurchaseEn } from './components/WagmiPresalePurchase/en';
import { wagmiPresalePurchaseLocale as wagmiPresalePurchaseRu } from './components/WagmiPresalePurchase/ru';
import { wagmiPresalePurchaseLocale as wagmiPresalePurchaseZh } from './components/WagmiPresalePurchase/zh';

// Language resources
const resources = {
  en: {
    translation: {
      header: headerEn,
      heroSection: heroEn,
      crazyAbout: crazyAboutEn,
      tokenPriceProgression: tokenPriceProgressionEn,
      crazyTokenomics: crazyTokenomicsEn,
      crazyFoxSpaceRoadmap: crazyFoxSpaceRoadmapEn,
      crazyCommunity: crazyCommunityEn,
      footer: footerEn,
      wagmiPresalePurchase: wagmiPresalePurchaseEn,
      common: {
        loading: "Loading...",
        error: "Error occurred",
        tryAgain: "Try again",
        close: "Close",
        copy: "Copy",
        copied: "Copied!",
        share: "Share",
        languageChanged: "Language changed to {{name}}"
      }
    }
  },
  ru: {
    translation: {
      header: headerRu,
      heroSection: heroRu,
      crazyAbout: crazyAboutRu,
      tokenPriceProgression: tokenPriceProgressionRu,
      crazyTokenomics: crazyTokenomicsRu,
      crazyFoxSpaceRoadmap: crazyFoxSpaceRoadmapRu,
      crazyCommunity: crazyCommunityRu,
      footer: footerRu,
      wagmiPresalePurchase: wagmiPresalePurchaseRu,
      common: {
        loading: "Загрузка...",
        error: "Произошла ошибка",
        tryAgain: "Попробовать снова",
        close: "Закрыть",
        copy: "Копировать",
        copied: "Скопировано!",
        share: "Поделиться",
        languageChanged: "Язык изменен на {{name}}"
      }
    }
  },
  zh: {
    translation: {
      header: headerZh,
      heroSection: heroZh,
      crazyAbout: crazyAboutZh,
      tokenPriceProgression: tokenPriceProgressionZh,
      crazyTokenomics: crazyTokenomicsZh,
      crazyFoxSpaceRoadmap: crazyFoxSpaceRoadmapZh,
      crazyCommunity: crazyCommunityZh,
      footer: footerZh,
      wagmiPresalePurchase: wagmiPresalePurchaseZh,
      common: {
        loading: "加载中...",
        error: "发生错误",
        tryAgain: "重试",
        close: "关闭",
        copy: "复制",
        copied: "已复制！",
        share: "分享",
        languageChanged: "语言已更改为{{name}}"
      }
    }
  }
};

// Language detection options
const detectionOptions = {
  order: ['localStorage', 'navigator', 'htmlTag'],
  caches: ['localStorage'],
  lookupLocalStorage: 'crazy-fox-language',
  checkForSupportedLanguage: true
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'ru', 'zh'],
    debug: process.env.NODE_ENV === 'development',
    
    detection: detectionOptions,
    
    interpolation: {
      escapeValue: false
    },
    
    react: {
      useSuspense: false
    }
  });

export default i18n;

// Type definitions for better TypeScript support
export type LanguageCode = 'en' | 'ru' | 'zh';

export const SUPPORTED_LANGUAGES = [
  { code: 'en' as const, name: 'English', flag: '🇺🇸' },
  { code: 'ru' as const, name: 'Русский', flag: '🇷🇺' },
  { code: 'zh' as const, name: '中文', flag: '🇨🇳' }
] as const;