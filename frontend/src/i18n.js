import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enDelivery from './module/delivery/locales/en.json';
import hiDelivery from './module/delivery/locales/hi.json';
import teDelivery from './module/delivery/locales/te.json';

const resources = {
    en: {
        translation: {
            ...enDelivery.translation,
            // Include delivery specific namespace if needed, but for simplicity let's flatten or use namespaces
            ...enDelivery
        }
    },
    hi: {
        translation: {
            ...hiDelivery.translation,
            ...hiDelivery
        }
    },
    te: {
        translation: {
            ...teDelivery.translation,
            ...teDelivery
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        },
        detection: {
            order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
            caches: ['localStorage']
        }
    });

export default i18n;
