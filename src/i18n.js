// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importation des fichiers de traduction
import translationEN from './locales/en/translation.json';
import translationFR from './locales/fr/translation.json';
import translationRU from './locales/ru/translation.json';
import translationES from './locales/es/translation.json';

i18n
  .use(LanguageDetector) // détecte la langue du navigateur ou localStorage
  .use(initReactI18next) // passe i18n à React
  .init({
    resources: {
      en: { translation: translationEN },
      fr: { translation: translationFR },
      ru: { translation: translationRU },
      es: { translation: translationES },
    },
    fallbackLng: 'en', // langue par défaut
    interpolation: {
      escapeValue: false, // React gère déjà la sécurité XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
