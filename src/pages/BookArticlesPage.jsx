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

/* ================== Fullscreen hero carousel ================== */
function FullscreenHeroCarousel({ items = [] }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  // ความสูงสไลด์ = เต็มหน้าจอ ลบความสูงเฮดเดอร์ ~96px
  const slideH = "calc(100vh - 96px)";

  // อัปเดต index จากการ scroll
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setIndex(i);
  };

  // ทำให้สกรอลล์แนวนอนด้วยล้อเมาส์
  const onWheel = (e) => {
    const el = trackRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  };

  // ลูกศรซ้าย/ขวา
  useEffect(() => {
    const h = (e) => {
      if (e.key === "ArrowRight") scrollTo(index + 1);
      if (e.key === "ArrowLeft") scrollTo(index - 1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [index]);

  const scrollTo = (i) => {
    const el = trackRef.current;
    if (!el) return;
    const next = Math.max(0, Math.min(items.length - 1, i));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    setIndex(next);
  };

  const slides = useMemo(
    () =>
      items.map((book, i) => {
        const id = book["o:id"];
        const title = titleOf(book) || `Item #${id}`;
        const rawDesc = descOf(book) || "";
        const desc = (stripTags(rawDesc) || " ").slice(0, 220) + (rawDesc.length > 220 ? "…" : "");
        const rawThumb =
          book?.thumbnail_display_urls?.large ||
          book?.thumbnail_display_urls?.medium ||
          book?.["o:thumbnail_urls"]?.large ||
          book?.["o:thumbnail_urls"]?.medium ||
          "";
        const cover = toHttps(rawThumb) || "/assets/placeholder.webp";
        const bg = BG_PALETTE[i % BG_PALETTE.length];

        return (
          <section
            key={id}
            className="snap-start shrink-0 w-full relative overflow-hidden"
            style={{ height: slideH, backgroundColor: bg }}
          >
            {/* โทนลอยเงาเหมือน Delassus */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-black/5 blur-3xl pointer-events-none" />

            {/* คอนเทนต์สองคอลัมน์ */}
            <div className="h-full max-w-[1200px] mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* ซ้าย: ชื่อ + ปุ่ม */}
              <div className="order-2 md:order-1 text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.1)]">
                <h2
                  className="font-extrabold leading-[0.95]"
                  style={{ fontSize: "clamp(2.2rem, 4vw + 1.5rem, 6rem)" }}
                >
                  {title}
                </h2>

                <p className="mt-5 text-white/90 max-w-xl" style={{ fontSize: "clamp(1rem, 0.6vw + 0.9rem, 1.25rem)" }}>
                  {desc}
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate(`/book/${id}`)}
                    className="inline-flex items-center h-12 px-6 rounded-full bg-white text-[#5b4a3e] shadow
                               hover:opacity-95 transition font-semibold"
                  >
                    Discover <span className="ml-2">→</span>
                  </button>
                  <Link
                    to={`/read/${id}`}
                    className="inline-flex items-center h-12 px-6 rounded-full bg-white/20 text-white ring-1 ring-white/40
                               hover:bg-white/25 transition"
                  >
                    Read now
                  </Link>
                </div>
              </div>

              {/* ขวา: ปกเล่มขนาดใหญ่ + เงา */}
              <div className="order-1 md:order-2 relative">
                <div className="relative mx-auto w-[70%] md:w-[85%] lg:w-[80%] aspect-[3/4]">
                  <img
                    src={cover}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl"
                    loading="lazy"
                    decoding="async"
                  />
                  {/* เงาวางบนพื้น */}
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
      {/* แทร็กสไลด์เต็มจอแนวนอน */}
      <div
        ref={trackRef}
        onScroll={onScroll}
        onWheel={onWheel}
        className="snap-x snap-mandatory overflow-x-auto overflow-y-hidden w-full
                   [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ height: slideH }}
      >
        <div className="flex w-max" style={{ height: "100%", minWidth: "100%" }}>
          {slides}
        </div>
      </div>

      {/* ปุ่มลูกศรซ้าย/ขวา */}
      <div className="pointer-events-none absolute inset-y-0 left-2 right-2 flex items-center justify-between">
        <button
          className="pointer-events-auto hidden sm:grid place-items-center h-11 w-11 rounded-full bg-white/90 shadow
                     ring-1 ring-black/10 hover:bg-white transition"
          onClick={() => scrollTo(index - 1)}
          aria-label="Prev"
        >
          ‹
        </button>
        <button
          className="pointer-events-auto hidden sm:grid place-items-center h-11 w-11 rounded-full bg-white/90 shadow
                     ring-1 ring-black/10 hover:bg-white transition"
          onClick={() => scrollTo(index + 1)}
          aria-label="Next"
        >
          ›
        </button>
      </div>

      {/* ดอทบอกตำแหน่งสไลด์ */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-6 flex gap-2">
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
