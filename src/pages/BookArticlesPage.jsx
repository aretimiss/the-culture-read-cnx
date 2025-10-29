// src/pages/BookArticlesPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import BackToTop from "../components/BackToTop";
import { fetchItemsLite, titleOf, descOf } from "../lib/omekaClient";

/* helpers */
const toHttps = (u) => (u ? (u.startsWith("http://") ? u.replace(/^http:/, "https:") : u) : "");
const stripTags = (html = "") => {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
};

/* พาเลตต์พื้นหลังแบบสลับโทน (ปรับได้ตามชอบ) */
/* พาเลตต์พื้นหลังแบบสลับโทน (กำหนดคู่กับสีข้อความ) */
const BG_PALETTE = [
  { bg: "#ff8a3d", text: "#ffffff" }, // citrus — ข้อความขาว
  { bg: "#f6d4b1", text: "#5b4a3e" }, // cream — ข้อความน้ำตาลเข้ม
  { bg: "#f0c2a8", text: "#5b4a3e" }, // peach — เข้ม
  { bg: "#ffd7a0", text: "#5b4a3e" }, // light orange — เข้ม
  { bg: "#ffe9d6", text: "#5b4a3e" }, // very light — เข้ม
];


/* ========= หน้าใหญ่แบบ Delassus: 1 เล่มต่อ 1 สไลด์เต็มจอ ========= */
export default function BookArticlesPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchItemsLite();
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
      <div className="min-h-screen flex flex-col bg-[#faf7f2]">
        <SiteHeader />
        <div className="flex-1 grid place-items-center text-[#7b6c61]">กำลังโหลด…</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#111518]">
      <SiteHeader />
      <FullscreenHeroCarousel items={books} />

    </div>
  );
}

function FullscreenHeroCarousel({ items = [] }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  // ความสูงสไลด์: รองรับ dynamic viewport
  const slideStyle = { "--headerH": "72px", height: "calc(100dvh - var(--headerH))" };

  const withAlpha = (hex, alpha = 0.9) => {
    // รองรับ #rgb / #rrggbb
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map(c => c + c).join("");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setIndex(i);
  };
  const onWheel = (e) => {
    const el = trackRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  };
  const scrollTo = (i) => {
    const el = trackRef.current;
    if (!el) return;
    const next = Math.max(0, Math.min(items.length - 1, i));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    setIndex(next);
  };

  useEffect(() => {
    const h = (e) => {
      if (e.key === "ArrowRight") scrollTo(index + 1);
      if (e.key === "ArrowLeft") scrollTo(index - 1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [index]);

  const slides = useMemo(
    () =>
      items.map((book, i) => {
        const id = book["o:id"];
        const title = titleOf(book) || `Item #${id}`;
        const rawDesc = descOf(book) || "";
        const clean = stripTags(rawDesc);
        const desc = (clean || " ").slice(0, 220) + (clean && clean.length > 220 ? "…" : "");
        const rawThumb =
          book?.thumbnail_display_urls?.large ||
          book?.thumbnail_display_urls?.medium ||
          book?.["o:thumbnail_urls"]?.large ||
          book?.["o:thumbnail_urls"]?.medium ||
          "";
        const cover = toHttps(rawThumb) || "/assets/placeholder.webp";

        const { bg, text } = BG_PALETTE[i % BG_PALETTE.length];
        const isLightText = text.toLowerCase() === "#ffffff";

        return (
          <section
            key={id}
            className="snap-start shrink-0 w-full relative overflow-hidden"
            style={{ ...slideStyle, background: bg, color: text }}
          >
            {/* ===== MOBILE (<= md) ===== */}
            <div className="md:hidden relative h-full">
              {/* ปกใหญ่ */}
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

              {/* ชื่อเรื่อง — ใช้สีจาก palette */}
             

              {/* ปุ่ม Discover สลับสไตล์ตามสีข้อความ */}
              <button
                onClick={() => navigate(`/book/${id}`)}
                className={`absolute left-1/2 -translate-x-1/2 bottom-[calc(20px+env(safe-area-inset-bottom))]
                           h-12 min-w-[210px] px-6 rounded-full font-semibold shadow-[0_12px_24px_rgba(0,0,0,0.22)] active:translate-y-[1px] ${
                             isLightText
                               ? "bg-white text-[#5b4a3e]"
                               : "bg-[#d8653b] text-white"
                           }`}
              >
                <span className="align-middle">Discover</span>
                <span className="ml-2 align-middle">→</span>
              </button>
            </div>

            {/* ===== DESKTOP (md+) ===== */}
            <div className="hidden md:grid h-full max-w-[1200px] mx-auto px-6 lg:px-8 grid-cols-2 gap-8 items-center">
              {/* ซ้าย: ข้อความ + ปุ่ม — ใช้สีพาเลตต์ */}
              <div className="drop-shadow-[0_1px_0_rgba(0,0,0,0.1)]" style={{ color: text }}>
                <h2
                  className="font-extrabold leading-[0.95]"
                  style={{ fontSize: "clamp(2.2rem, 4vw + 1.5rem, 6rem)" }}
                >
                  {title}
                </h2>
                <p
                  className="mt-5 max-w-xl"
                  style={{ color: withAlpha(text, 0.9), fontSize: "clamp(1rem, 0.6vw + 0.9rem, 1.25rem)" }}
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
                    Discover <span className="ml-2">→</span>
                  </button>
                  <Link
                    to={`/read/${id}`}
                    className={`inline-flex items-center h-12 px-6 rounded-full ring-1 transition ${
                      isLightText
                        ? "bg-white/20 text-white ring-white/40 hover:bg-white/25"
                        : "bg-black/10 text-[#5b4a3e] ring-black/10 hover:bg-black/15"
                    }`}
                  >
                    Read now
                  </Link>
                </div>
              </div>

              {/* ขวา: ปก */}
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
    [items]
  );

  if (items.length === 0) {
    return (
      <main className="pt-28 pb-16">
        <p className="text-center text-[#7b6c61]">ยังไม่มีรายการสำหรับแสดง</p>
      </main>
    );
  }

  return (
    <div className="relative">
      {/* แทร็กสไลด์แนวนอนเต็มจอ */}
      <div
        ref={trackRef}
        onScroll={onScroll}
        onWheel={onWheel}
        className="snap-x snap-mandatory overflow-x-auto overflow-y-hidden w-full
                   [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden touch-pan-x"
        style={slideStyle}
      >
        <div className="flex w-max" style={{ height: "100%", minWidth: "100%" }}>
          {slides}
        </div>
      </div>

      {/* ลูกศร (md+) */}
      <div className="pointer-events-none absolute inset-y-0 left-2 right-2 hidden md:flex items-center justify-between">
        <button
          className="pointer-events-auto grid place-items-center h-11 w-11 rounded-full bg-white/90 shadow ring-1 ring-black/10 hover:bg-white transition"
          onClick={() => scrollTo(index - 1)}
          aria-label="Prev"
        >
          ‹
        </button>
        <button
          className="pointer-events-auto grid place-items-center h-11 w-11 rounded-full bg-white/90 shadow ring-1 ring-black/10 hover:bg-white transition"
          onClick={() => scrollTo(index + 1)}
          aria-label="Next"
        >
          ›
        </button>
      </div>

      {/* ดอท */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[calc(16px+env(safe-area-inset-bottom))] flex gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className={`h-2.5 rounded-full transition-all ${
              index === i ? "w-8 bg-white" : "w-2.5 bg-white/60 hover:bg-white"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}


