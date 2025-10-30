// src/pages/BookArticlesPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import BackToTop from "../components/BackToTop";

import { fetchItemsLite } from "../lib/omekaClient";
import { pickLang } from "../lib/i18nPick";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

/* helpers */
const toHttps = (u) =>
  u ? (u.startsWith("http://") ? u.replace(/^http:/, "https:") : u) : "";
const stripTags = (html = "") => {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
};

/* พาเลตต์พื้นหลัง + สีข้อความ (วนใช้ต่อสไลด์) */
const BG_PALETTE = [
  { bg: "#ff8a3d", text: "#ffffff" },
  { bg: "#f6d4b1", text: "#5b4a3e" },
  { bg: "#f0c2a8", text: "#5b4a3e" },
  { bg: "#ffd7a0", text: "#5b4a3e" },
  { bg: "#ffe9d6", text: "#5b4a3e" },
];

/* ========= หน้าใหญ่แบบ Delassus: 1 เล่มต่อ 1 สไลด์เต็มจอ ========= */
export default function BookArticlesPage() {
  const { t } = useTranslation();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchItemsLite({ limit: 36, sortBy: "created", sortOrder: "desc" });
        // มี description อย่างน้อยหนึ่งภาษาเท่านั้นถึงจะแสดง
        const filtered = (res || []).filter(
          (it) => Array.isArray(it["dcterms:description"]) && it["dcterms:description"].length > 0
        );
        setBooks(filtered);
      } catch (e) {
        console.error("โหลดรายการล้มเหลว", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen text-[#111518]">
        <SiteHeader />
        <main className="pt-28 grid place-items-center text-[#7b6c61]">
          {t("status.loading", "กำลังโหลด…")}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#111518]">
      <SiteHeader />
      <FullscreenHeroCarousel items={books} />
      <BackToTop />
     
    </div>
  );
}

function FullscreenHeroCarousel({ items = [] }) {
  const { t } = useTranslation();
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  // ความสูงสไลด์: หัก header ออกด้วย dvh
  const slideStyle = { "--headerH": "72px", height: "calc(100dvh - var(--headerH))" };

  const withAlpha = (hex, alpha = 0.9) => {
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // อัปเดต index ตามการเลื่อนแนวตั้ง
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    setIndex(i);
  };

  const scrollTo = (i) => {
    const el = trackRef.current;
    if (!el) return;
    const next = Math.max(0, Math.min(items.length - 1, i));
    el.scrollTo({ top: next * el.clientHeight, behavior: "smooth" });
    setIndex(next);
  };

  useEffect(() => {
    const h = (e) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") scrollTo(index + 1);
      if (e.key === "ArrowUp" || e.key === "PageUp") scrollTo(index - 1);
      if (e.key === "Home") scrollTo(0);
      if (e.key === "End") scrollTo(items.length - 1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [index, items.length]);

  // เตรียมสไลด์ (ผูกสี/ข้อความตามพาเลตต์ของสไลด์นั้น ๆ)
  const slides = useMemo(
    () =>
      items.map((book, i) => {
        const id = book["o:id"];
        const title =
          pickLang(book?.["dcterms:title"], i18n.language) || `Item #${id}`;
        const rawDesc = pickLang(book?.["dcterms:description"], i18n.language) || "";
        const clean = stripTags(rawDesc);
        const desc = (clean || " ").slice(0, 220) + (clean && clean.length > 220 ? "…" : "");
        const rawThumb =
          book?.thumbnail_display_urls?.large ||
          book?.thumbnail_display_urls?.medium ||
          book?.["o:thumbnail_urls"]?.large ||
          book?.["o:thumbnail_urls"]?.medium ||
          "";
        const cover = toHttps(rawThumb) || "/assets/placeholder.webp";

        // พาเลตต์ของสไลด์นี้
        const { text } = BG_PALETTE[i % BG_PALETTE.length];
        const isLightText = text.toLowerCase() === "#ffffff";

        return (
          <section key={id} className="snap-start w-full relative overflow-hidden" style={slideStyle}>
            {/* ===== MOBILE (<= md) ===== */}
            <div className="md:hidden relative h-full" style={{ color: text }}>
              <div className="absolute inset-x-0 top-[10dvh] bottom-[22dvh]">
                <div className="relative h-full w-full">
                  <img
                    src={cover}
                    alt={title}
                    className="absolute inset-0 mx-auto h-full max-h-[62dvh] object-contain drop-shadow-2xl"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-[-10px] h-9 w-[70%] rounded-full bg-black/25 blur-xl opacity-40" />
                </div>
              </div>

              <button
                onClick={() => navigate(`/book/${id}`)}
                className={`absolute left-1/2 -translate-x-1/2 bottom-[calc(20px+env(safe-area-inset-bottom))]
                           h-12 min-w-[210px] px-6 rounded-full font-semibold shadow-[0_12px_24px_rgba(0,0,0,0.22)] active:translate-y-[1px] ${
                             isLightText ? "bg-white text-[#5b4a3e]" : "bg-[#d8653b] text-white"
                           }`}
              >
                <span className="align-middle">{t("actions.discover", "Discover")}</span>
                <span className="ml-2 align-middle">→</span>
              </button>
            </div>

            {/* ===== DESKTOP (md+) ===== */}
            <div
              className="hidden md:grid h-full max-w-[1200px] mx-auto px-6 lg:px-8 grid-cols-2 gap-8 items-center"
              style={{ color: text }}
            >
              <div className="drop-shadow-[0_1px_0_rgba(0,0,0,0.1)]">
                <h2
                  className="font-extrabold leading-[0.95]"
                  style={{ fontSize: "clamp(2.2rem, 4vw + 1.5rem, 6rem)" }}
                >
                  {title}
                </h2>
                <p
                  className="mt-5 max-w-xl"
                  style={{
                    color: withAlpha(text, 0.9),
                    fontSize: "clamp(1rem, 0.6vw + 0.9rem, 1.25rem)",
                  }}
                >
                  {desc}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate(`/book/${id}`)}
                    className={`inline-flex items-center h-12 px-6 rounded-full shadow transition font-semibold ${
                      isLightText ? "bg-white text-[#5b4a3e]" : "bg-[#d8653b] text-white"
                    } hover:opacity-95`}
                  >
                    {t("actions.discover", "Discover")} <span className="ml-2">→</span>
                  </button>
                  <Link
                    to={`/read/${id}`}
                    className={`inline-flex items-center h-12 px-6 rounded-full ring-1 transition ${
                      isLightText
                        ? "bg-white/20 text-white ring-white/40 hover:bg-white/25"
                        : "bg-black/10 text-[#5b4a3e] ring-black/10 hover:bg-black/15"
                    }`}
                  >
                    {t("actions.readNow", "Read now")}
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="relative mx-auto w-[85%] lg:w-[78%] aspect-[3/4]">
                  <img
                    src={cover}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute -bottom-6 inset-x-0 mx-auto h-10 w-4/5 rounded-full bg-black/20 blur-xl opacity-40" />
                </div>
              </div>
            </div>
          </section>
        );
      }),
    [items, i18n.language]
  );

  if (items.length === 0) {
    return (
      <main className="pt-28 pb-16">
        <p className="text-center text-[#7b6c61]">
          {t("status.empty", "ยังไม่มีรายการสำหรับแสดง")}
        </p>
      </main>
    );
  }

  // สีพื้นหลังเปลี่ยนตาม index ด้วย transition
  const { bg } = BG_PALETTE[index % BG_PALETTE.length];

  return (
    <div className="relative z-10" style={{ ...slideStyle }}>
      {/* พื้นหลัง fixed + transition สี */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: `linear-gradient(145deg, ${bg} 0%, rgba(0,0,0,0.06) 100%)`,
          transition: "background 500ms ease",
        }}
      />

      {/* แทร็กสไลด์แนวตั้งเต็มจอ */}
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="snap-y snap-mandatory overflow-y-auto overflow-x-hidden h-full
                   [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden touch-pan-y relative z-10"
      >
        <div className="block" style={{ minHeight: "100%" }}>
          {slides}
        </div>
      </div>

      {/* ปุ่มนำทางแนวตั้ง */}
      <div>
        {/* Desktop */}
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center gap-3 z-20">
          <button
            className="pointer-events-auto grid place-items-center h-11 w-11 rounded-full
                      bg-white/80 backdrop-blur-md shadow-lg ring-1 ring-black/10 hover:bg-white transition"
            onClick={() => scrollTo(index - 1)}
            aria-label="Previous"
            title="Previous"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 15l6-6 6 6" />
            </svg>
          </button>

          <button
            className="pointer-events-auto grid place-items-center h-11 w-11 rounded-full
                      bg-white/80 backdrop-blur-md shadow-lg ring-1 ring-black/10 hover:bg-white transition"
            onClick={() => scrollTo(index + 1)}
            aria-label="Next"
            title="Next"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 9l-6 6-6-6" />
            </svg>
          </button>
        </div>

        {/* Mobile */}
        <div className="pointer-events-none fixed bottom-[calc(70px+env(safe-area-inset-bottom))] right-4 flex md:hidden flex-col gap-3 z-30">
          <button
            className="pointer-events-auto grid place-items-center h-10 w-10 rounded-full
                      bg-white/80 backdrop-blur-md shadow-lg ring-1 ring-black/10 hover:bg-white transition"
            onClick={() => scrollTo(index - 1)}
            aria-label="Prev (mobile)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 15l6-6 6 6" />
            </svg>
          </button>

          <button
            className="pointer-events-auto grid place-items-center h-10 w-10 rounded-full
                      bg-white/80 backdrop-blur-md shadow-lg ring-1 ring-black/10 hover:bg-white transition"
            onClick={() => scrollTo(index + 1)}
            aria-label="Next (mobile)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 9l-6 6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* ดอทแนวตั้งด้านขวา (Desktop) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-2 z-20">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className={`h-2.5 rounded-full transition-all ${
              index === i ? "w-8 bg-white" : "w-2.5 bg-white/60 hover:bg-white"
            }`}
            aria-label={`Go to slide ${i + 1}`}
            title={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
