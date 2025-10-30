// src/components/SiteHeader.jsx
import React, { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Globe2, X, Menu, Minus, Plus, Check } from "lucide-react";
import i18n from "../i18n";
import { useTranslation } from "react-i18next";

/* ===== Lock scroll เมื่อเมนูเปิด ===== */
function useLockBody(lock) {
  useEffect(() => {
    if (!lock) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, [lock]);
}

/* ===== รายการภาษา (เพิ่ม/ลดที่นี่ได้เลย) ===== */
const LANGS = [
  { code: "th", label: "ไทย" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "lo", label: "ລາວ" },
  { code: "fil", label: "Filipino" },
];

/* ===== map ขนาดตัวอักษร → root font-size =====
   100% = ฐาน Tailwind ทั้งหมดจะขยาย/ย่อไปพร้อมกัน */
const FONT_SCALES = {
  small: "93.75%", // ≈ 15px
  base: "100%",    // 16px
  large: "112.5%", // 18px
};

export default function SiteHeader() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // states ของ dropdown ภาษา + ขนาดอักษร
  const [lang, setLang] = useState(i18n.language || "en");
  const [fontScale, setFontScale] = useState(
    localStorage.getItem("fontScale") || "base"
  );

  useLockBody(open);

  /* ===== apply initial values ===== */
  useEffect(() => {
    // scroll behavior header
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // โหลดค่าที่เคยเลือกไว้
    const savedLang = localStorage.getItem("lang");
    if (savedLang && savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang);
      setLang(savedLang);
      document.documentElement.setAttribute("lang", savedLang);
    } else {
      document.documentElement.setAttribute("lang", i18n.language || "en");
    }

    const savedScale = localStorage.getItem("fontScale");
    if (savedScale && FONT_SCALES[savedScale]) {
      setFontScale(savedScale);
      document.documentElement.style.fontSize = FONT_SCALES[savedScale];
    } else {
      document.documentElement.style.fontSize = FONT_SCALES["base"];
    }
  }, []);

  /* ===== handlers ===== */
  const handleChangeLang = async (code) => {
    setLang(code);
    localStorage.setItem("lang", code);
    document.documentElement.setAttribute("lang", code);
    try {
      await i18n.changeLanguage(code);
    } catch (e) {
      console.warn("changeLanguage error:", e);
    }
  };

  const applyFontScale = (key) => {
    const val = FONT_SCALES[key] || FONT_SCALES.base;
    setFontScale(key);
    localStorage.setItem("fontScale", key);
    document.documentElement.style.fontSize = val;
  };

  const decFont = () => {
    if (fontScale === "large") applyFontScale("base");
    else if (fontScale === "base") applyFontScale("small");
  };
  const incFont = () => {
    if (fontScale === "small") applyFontScale("base");
    else if (fontScale === "base") applyFontScale("large");
  };

  return (
    <>
      {/* ===== HEADER ===== */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all ${
          scrolled ? "h-16" : "h-20"
        }`}
      >
        <div
          className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 h-full flex items-center justify-between rounded-b-2xl transition-all
            ${
              scrolled
                ? "bg-white/80 backdrop-blur-md shadow-md ring-1 ring-black/10"
                : "bg-white/25 backdrop-blur-md ring-1 ring-black/10"
            }`}
        >
          {/* โลโก้ */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/assets/logo.png"
              alt="Logo"
              className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/90 p-2 shadow ring-1 ring-black/10"
            />
            <span className="sr-only">Home</span>
          </Link>

          {/* ปุ่มแฮมเบอร์เกอร์ */}
          <button
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/90 backdrop-blur-md
                       shadow ring-1 ring-black/10 hover:scale-[1.03] active:scale-[0.99] transition"
          >
            <Menu className="w-6 h-6 text-[#5b4a3e]" />
          </button>
        </div>
      </header>

      {/* spacer ป้องกัน header ทับ */}
      <div className="h-20 md:h-20" />

      {/* ===== Overlay ===== */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* ===== Drawer ===== */}
      <nav
        className={`fixed top-0 right-0 h-full w-[88%] max-w-[420px] z-[70] bg-[#fffaf2] shadow-2xl ring-1 ring-black/10 
                    transition-transform duration-300 ease-out
                    ${open ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!open}
      >
        {/* หัวเมนู */}
        <div className="p-6 flex items-center justify-between border-b border-black/10">
          <div className="flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-[#5b4a3e]" />
            <span className="text-xl font-bold text-[#5b4a3e]">
              {t("menu.title", "Menu")}
            </span>
          </div>
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="w-10 h-10 rounded-xl bg-[#5b4a3e] text-white grid place-items-center hover:bg-[#d8653b] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ===== ภาษากับขนาดอักษร ===== */}
        <div className="p-6 border-b border-black/10 space-y-6">
          {/* Language dropdown */}
          <div>
            <h3 className="text-sm uppercase font-semibold tracking-wider text-[#a5866e] mb-2">
              {t("menu.language", "Language")}
            </h3>
            <div className="relative">
              <select
                value={lang}
                onChange={(e) => handleChangeLang(e.target.value)}
                className="w-full appearance-none px-4 py-3 rounded-xl border border-[#eadfce] bg-white/90 text-[#5b4a3e]
                           font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#d8653b]/40"
              >
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
              {/* caret */}
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5b4a3e]/60">
                ▾
              </div>
            </div>
            {/* แสดงภาษาที่เลือก */}
            <div className="mt-2 text-sm text-[#5b4a3e]/80 flex items-center gap-2">
              <Check className="w-4 h-4" />{" "}
              {t("menu.currentLang", "Current")}:{" "}
              {LANGS.find((l) => l.code === lang)?.label || lang}
            </div>
          </div>

          {/* Font size */}
          <div>
            <h3 className="text-sm uppercase font-semibold tracking-wider text-[#a5866e] mb-2">
              {t("menu.fontSize", "Font size")}
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={decFont}
                className="w-10 h-10 rounded-xl border border-[#eadfce] bg-white/90 text-[#5b4a3e]
                           grid place-items-center hover:bg-[#d8653b] hover:text-white transition"
                title={t("menu.decrease", "Decrease")}
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => applyFontScale("small")}
                  className={`px-3 py-2 rounded-lg border font-semibold ${
                    fontScale === "small"
                      ? "bg-[#5b4a3e] text-white border-[#5b4a3e]"
                      : "bg-white/90 text-[#5b4a3e] border-[#eadfce]"
                  }`}
                >
                  A-
                </button>
                <button
                  onClick={() => applyFontScale("base")}
                  className={`px-3 py-2 rounded-lg border font-semibold ${
                    fontScale === "base"
                      ? "bg-[#5b4a3e] text-white border-[#5b4a3e]"
                      : "bg-white/90 text-[#5b4a3e] border-[#eadfce]"
                  }`}
                >
                  A
                </button>
                <button
                  onClick={() => applyFontScale("large")}
                  className={`px-3 py-2 rounded-lg border font-semibold ${
                    fontScale === "large"
                      ? "bg-[#5b4a3e] text-white border-[#5b4a3e]"
                      : "bg-white/90 text-[#5b4a3e] border-[#eadfce]"
                  }`}
                >
                  A+
                </button>
              </div>

              <button
                onClick={incFont}
                className="w-10 h-10 rounded-xl border border-[#eadfce] bg-white/90 text-[#5b4a3e]
                           grid place-items-center hover:bg-[#d8653b] hover:text-white transition"
                title={t("menu.increase", "Increase")}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-2 text-sm text-[#5b4a3e]/80">
              {t("menu.currentSize", "Current size")}:{" "}
              {fontScale === "small" ? "A-" : fontScale === "large" ? "A+" : "A"}
            </div>
          </div>
        </div>

        {/* ===== ลิงก์เมนูหลัก ===== */}
        <ul className="p-6 space-y-4">
          {[
            { to: "/", label: t("nav.home", "Home") },
            { to: "/books", label: t("nav.books", "Books") },
            { to: "/articles", label: t("nav.articles", "Articles") },
          ].map((m) => (
            <li key={m.to}>
              <NavLink
                to={m.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block text-2xl font-bold tracking-tight transition
                   ${isActive ? "text-[#d8653b]" : "text-[#5b4a3e] hover:text-[#d8653b]"}`
                }
              >
                {m.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
