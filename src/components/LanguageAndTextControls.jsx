import React from "react";
import i18n from "../i18n";
import { useTranslation } from "react-i18next";
import { useSettings } from "../context/SettingsContext";

const LANGS = [
  { code: "th", label: "ไทย" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "lo", label: "ລາວ" },
  { code: "fil", label: "Filipino" }
];

export default function LanguageAndTextControls({ className = "" }) {
  const { t } = useTranslation();
  const { textSize, setTextSize } = useSettings();

  const changeLang = (e) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang === "tl" ? "fil" : lang);
    localStorage.setItem("i18nextLng", lang);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <label className="sr-only">{t("controls.language")}</label>
      <select
        value={i18n.language === "tl" ? "fil" : (i18n.language || "th")}
        onChange={changeLang}
        className="rounded-xl bg-white/90 text-[#111] px-3 py-1 text-sm shadow-sm ring-1 ring-black/10"
      >
        {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>

      <div className="flex items-center gap-1">
        <span className="text-xs opacity-80">{t("controls.textSize")}</span>
        <button onClick={() => setTextSize("sm")} className={`px-2 py-1 rounded-lg ring-1 ring-black/10 shadow-sm ${textSize==="sm"?"bg-white":"bg-white/70"}`}>A−</button>
        <button onClick={() => setTextSize("md")} className={`px-2 py-1 rounded-lg ring-1 ring-black/10 shadow-sm ${textSize==="md"?"bg-white":"bg-white/70"}`}>A</button>
        <button onClick={() => setTextSize("lg")} className={`px-2 py-1 rounded-lg ring-1 ring-black/10 shadow-sm ${textSize==="lg"?"bg-white":"bg-white/70"}`}>A+</button>
      </div>
    </div>
  );
}
