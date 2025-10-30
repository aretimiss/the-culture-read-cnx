import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import th from "./th.json";
import en from "./en.json";
import zh from "./zh.json";
import lo from "./lo.json";
import fil from "./fil.json";

const resources = {
  th: { translation: th },
  en: { translation: en },
  zh: { translation: zh },
  lo: { translation: lo },
  fil: { translation: fil },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "th",
    supportedLngs: ["th", "en", "zh", "lo", "fil", "tl"],
    load: "languageOnly",
    detection: {
      order: ["localStorage", "querystring", "navigator"],
      lookupQuerystring: "lang",
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
  });

// ทำ alias ให้ 'tl' = Filipino
if (i18n.language === "tl") i18n.changeLanguage("fil");

export default i18n;
