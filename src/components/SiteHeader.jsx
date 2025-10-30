// src/components/SiteHeader.jsx
import React, { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Globe2, X, Menu, Check } from "lucide-react"; // ⬅️ ตัด Minus/Plus ออก
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

// โหลดฟอนต์จีนเฉพาะตอนจำเป็น
function ensureChineseFontLoaded() {
  if (document.getElementById("font-zh")) return;
  const link = document.createElement("link");
  link.id = "font-zh";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;600;700&display=swap";
  link.onload = () => {
    const ui = getComputedStyle(document.documentElement).getPropertyValue(
      "--font-ui"
    );
    document.documentElement.style.setProperty("--font-zh", `"Noto Sans SC", ${ui}`);
  };
  document.head.appendChild(link);
}

/* รายการภาษา */
const LANGS = [
  { code: "th", label: "ไทย" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "lo", label: "ລາວ" },
  { code: "fil", label: "Filipino" },
];

/* map ขนาดตัวอักษร → root font-size */
const FONT_SCALES = {
  small: "93.75%", // ~15px
  base: "100%", // 16px
  large: "112.5%", // ~18px
};

export default function SiteHeader() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // states ของภาษากับขนาดอักษร
  const [lang, setLang] = useState(i18n.language || "en");
  const [fontScale, setFontScale] = useState(
    localStorage.getItem("fontScale") || "base"
  );

  useLockBody(open);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const savedLang = localStorage.getItem("lang");
    const useLang = savedLang || i18n.language || "en";
    setLang(useLang);
    document.documentElement.setAttribute("lang", useLang);
    i18n.changeLanguage(useLang).catch(() => {});
    if (useLang === "zh") ensureChineseFontLoaded();

    const savedScale = localStorage.getItem("fontScale");
    const scaleKey = savedScale && FONT_SCALES[savedScale] ? savedScale : "base";
    setFontScale(scaleKey);
    document.documentElement.style.fontSize = FONT_SCALES[scaleKey];
  }, []);

  const handleChangeLang = async (code) => {
    setLang(code);
    localStorage.setItem("lang", code);
    document.documentElement.setAttribute("lang", code);
    try {
      await i18n.changeLanguage(code);
    } catch {}
    if (code === "zh") ensureChineseFontLoaded();
  };

  const applyFontScale = (key) => {
    const val = FONT_SCALES[key] || FONT_SCALES.base;
    setFontScale(key);
    localStorage.setItem("fontScale", key);
    document.documentElement.style.fontSize = val;
  };

  return (
    <>
      {/* Header */}
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
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/assets/logo.png"
              alt="Logo"
              className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/90 p-2 shadow ring-1 ring-black/10"
            />
            <span className="sr-only">Home</span>
          </Link>

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

      {/* spacer */}
      <div className="h-20 md:h-20" />

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
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

        {/* ------- เนื้อหาเมนู: ทำเป็นคอลัมน์ + เลื่อนในตัว + เว้นล่างเยอะ ------- */}
        <div
          className="
            flex-1 overflow-y-auto 
            p-6 space-y-8 
            pb-32                              /* กันชิดล่าง */
            scroll-pt-4 no-scrollbar
          "
        >
          {/* Language */}
          <section className="space-y-2">
            <h3 className="text-sm uppercase font-semibold tracking-wider text-[#a5866e]">
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
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5b4a3e]/60">
                ▾
              </div>
            </div>
            <div className="text-sm text-[#5b4a3e]/80 flex items-center gap-2">
              <Check className="w-4 h-4" />
              {t("menu.currentLang", "Current")}:{" "}
              {LANGS.find((l) => l.code === lang)?.label || lang}
            </div>
          </section>

          {/* Font size — ลบปุ่ม − / + ออก เหลือแค่ A-, A, A+ */}
          <section className="space-y-3">
            <h3 className="text-sm uppercase font-semibold tracking-wider text-[#a5866e]">
              {t("menu.fontSize", "Font size")}
            </h3>
            <div className="flex items-center justify-start gap-2">
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
            <div className="text-sm text-[#5b4a3e]/80">
              {t("menu.currentSize", "Current size")}:{" "}
              {fontScale === "small" ? "A-" : fontScale === "large" ? "A+" : "A"}
            </div>
          </section>

          {/* ลิงก์เมนูหลัก — เพิ่มช่องไฟแนวตั้ง และเว้นขอบล่าง */}
          <section className="pt-2">
            <ul className="space-y-5">
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
                       ${
                         isActive
                           ? "text-[#d8653b]"
                           : "text-[#5b4a3e] hover:text-[#d8653b]"
                       }`
                    }
                  >
                    {m.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </nav>
    </>
  );
}
