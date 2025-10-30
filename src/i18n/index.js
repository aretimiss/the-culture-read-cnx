// src/i18n/index.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// โหลดไฟล์ JSON ของแต่ละภาษา
import th from "./th.json";
import en from "./en.json";
import zh from "./zh.json";
import lo from "./lo.json";
import fil from "./fil.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      th: { translation: th },
      en: { translation: en },
      zh: { translation: zh },
      lo: { translation: lo },
      fil: { translation: fil },
    },
    lng: "th",               // ค่าเริ่มต้น (จะถูก override ด้วย localStorage จาก SiteHeader)
    fallbackLng: "en",
    supportedLngs: ["th", "en", "zh", "lo", "fil"],
    interpolation: { escapeValue: false },
    returnEmptyString: false,
  });

export default i18n;
