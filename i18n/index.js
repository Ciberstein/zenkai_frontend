import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';

import es from './lang/es.json'
import en from './lang/en.json'
import ja from './lang/ja.json'

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
    ja: { translation: ja },
  },

  lng: localStorage.getItem('lang'),
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
