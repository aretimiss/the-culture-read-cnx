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
const BG_PALETTE = [
  "#ff8a3d", // citrus
  "#f6d4b1", // cream
  "#f0c2a8", // peach
  "#ffd7a0", // light orange
  "#ffe9d6", // very light
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
      <Footer />
      <BackToTop />
    </div>
  );
}

/* ================== Fullscreen hero carousel (fixed BG_PALETTE) ================== */
function FullscreenHeroCarousel({ items = [] }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  // ใช้ dynamic viewport + header height
  const slideStyle = { "--headerH": "72px", height: "calc(100dvh - var(--headerH))" };

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
        const base = BG_PALETTE[i % BG_PALETTE.length];

        return (
          <section
            key={id}
            className="snap-start shrink-0 w-full relative overflow-hidden"
            // ✅ ใส่สีพื้นหลังตรงที่ section เลย
            style={{
              ...slideStyle,
              background: `linear-gradient(135deg, ${base} 0%, ${base} 100%)`,
            }}
          >
            {/* ❌ ไม่ต้องมี absolute overlay ใด ๆ ซ้อนพื้นหลัง */}

            {/* ===== MOBILE (<= md) ===== */}
            <div className="md:hidden relative h-full">
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

              <h2
                className="absolute left-1/2 -translate-x-1/2 top-[38dvh] text-center text-white font-extrabold leading-none drop-shadow px-3"
                style={{ fontSize: "clamp(1.8rem, 8vw, 2.8rem)" }}
              >
                {title}
              </h2>

              <button
                onClick={() => navigate(`/book/${id}`)}
                className="absolute left-1/2 -translate-x-1/2 bottom-[calc(20px+env(safe-area-inset-bottom))] h-12 min-w-[210px] px-6 rounded-full text-white font-semibold shadow-[0_12px_24px_rgba(0,0,0,0.22)] bg-gradient-to-b from-[#ff7d6a] to-[#ff6a5a] active:translate-y-[1px]"
              >
                <span className="align-middle">Discover</span>
                <span className="ml-2 align-middle">→</span>
              </button>
            </div>

            {/* ===== DESKTOP (md+) ===== */}
            <div className="hidden md:grid h-full max-w-[1200px] mx-auto px-6 lg:px-8 grid-cols-2 gap-8 items-center text-white">
              <div className="drop-shadow-[0_1px_0_rgba(0,0,0,0.1)]">
                <h2
                  className="font-extrabold leading-[0.95]"
                  style={{ fontSize: "clamp(2.2rem, 4vw + 1.5rem, 6rem)" }}
                >
                  {title}
                </h2>
                <p
                  className="mt-5 text-white/90 max-w-xl"
                  style={{ fontSize: "clamp(1rem, 0.6vw + 0.9rem, 1.25rem)" }}
                >
                  {desc}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate(`/book/${id}`)}
                    className="inline-flex items-center h-12 px-6 rounded-full bg-white text-[#5b4a3e] shadow hover:opacity-95 transition font-semibold"
                  >
                    Discover <span className="ml-2">→</span>
                  </button>
                  <Link
                    to={`/read/${id}`}
                    className="inline-flex items-center h-12 px-6 rounded-full bg-white/20 text-white ring-1 ring-white/40 hover:bg-white/25 transition"
                  >
                    Read now
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


