import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../assets/locales/en.json';
import tr from '../assets/locales/tr.json';

const defaultLanguage = import.meta.env.VITE_DEFAULT_LANGUAGE || 'en';
const defaultFallBackLanguage = import.meta.env.VITE_FALLBACK_LANGUAGE || 'tr';

i18n.use(initReactI18next).init({
    resources: {
        tr: {
            translation: tr
        },
        en: {
            translation: en
        }
    },
    lng: defaultLanguage,
    fallbackLng: defaultFallBackLanguage,
    interpolation: {
        escapeValue: false
    }
});

export default i18n;