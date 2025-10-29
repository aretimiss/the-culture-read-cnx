// src/pages/BookArticlesPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import BackToTop from "../components/BackToTop";
import { fetchItemsLite, titleOf, descOf } from "../lib/omekaClient";

/** Tailwind helper: ซ่อนสก롤บาร์ (ใส่ไว้ที่ global.css ก็ได้)
 * .no-scrollbar::-webkit-scrollbar{display:none}
 * .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
 */

export default function BookArticlesPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchItemsLite();
        // เฉพาะที่มีคำอธิบาย
        const filtered = (res || []).filter(
          (item) => Array.isArray(item["dcterms:description"]) && item["dcterms:description"].length > 0
        );
        setBooks(filtered);
      } catch (err) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#faf7f2]">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center text-[#7b6c61]">
          กำลังโหลด...
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#111518]">
      <SiteHeader />
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* HERO / Heading */}
        <header className="mb-8 md:mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-widest uppercase text-[#7b6c61]">Curated</p>
            <h1 className="text-2xl md:text-4xl font-extrabold text-[#5b4a3e]">
              Rare Books Showcase
            </h1>
          </div>
          <Link
            to="/books"
            className="hidden sm:inline-flex items-center h-10 px-4 rounded-full bg-white ring-1 ring-[#e7d8c9] text-[#5b4a3e] hover:bg-[#fff7ee] transition shadow-sm"
          >
            ดูทั้งหมด
          </Link>
        </header>

        {/* CAROUSEL */}
        <HorizontalCarousel items={books} />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}

/* ================== Horizontal Carousel (Delassus-like) ================== */
function HorizontalCarousel({ items = [] }) {
  const trackRef = useRef(null);
  const [progress, setProgress] = useState(0);

  // อัปเดตแถบความคืบหน้า
  const updateProgress = () => {
    const el = trackRef.current;
    if (!el) return;
    const p = el.scrollLeft / (el.scrollWidth - el.clientWidth || 1);
    setProgress(Math.min(1, Math.max(0, p)));
  };

  // ปรับเมาส์สกอลล์ให้เลื่อนแนวนอน
  const onWheel = (e) => {
    const el = trackRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateProgress();
    el.addEventListener("scroll", updateProgress, { passive: true });
    return () => el.removeEventListener("scroll", updateProgress);
  }, []);

  // ปุ่มเลื่อน
  const scrollByCards = (dir = 1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector("[data-card]"); // การ์ดแรก
    const step = card ? card.getBoundingClientRect().width + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const cards = useMemo(
    () =>
      items.map((book) => {
        const id = book["o:id"];
        const title = titleOf(book) || "Untitled";
        const rawDesc = descOf(book) || "";
        const desc = rawDesc.length > 160 ? rawDesc.slice(0, 160) + "…" : rawDesc;
        const thumb =
          book?.thumbnail_display_urls?.large ||
          book?.thumbnail_display_urls?.medium ||
          "/assets/placeholder.webp";

        return (
          <article
            key={id}
            data-card
            className="snap-start shrink-0 w-[78%] sm:w-[55%] md:w-[40%] lg:w-[32%] xl:w-[28%] 
                       bg-white/95 border border-[#e7d8c9] rounded-3xl shadow-sm 
                       hover:shadow-lg transition-all duration-300 overflow-hidden"
          >
            <Link to={`/book/${id}`} className="group flex flex-col h-full">
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={thumb}
                  alt={title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                />
                {/* มุมบนซ้าย: แท็ก */}
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 text-xs rounded-full bg-[#fffaf3]/90 ring-1 ring-[#eadfce] text-[#5b4a3e]">
                    Rare Book
                  </span>
                </div>
              </div>

              <div className="p-4 md:p-5 flex flex-col gap-2 flex-1">
                <h3 className="text-base md:text-lg font-semibold text-[#5b4a3e] line-clamp-2">
                  {title}
                </h3>
                <p className="text-sm text-[#7b6c61] line-clamp-3">{desc}</p>

                <div className="mt-auto pt-2 flex items-center justify-between">
                  <span className="text-[#d8653b] font-medium">อ่านต่อ →</span>
                  <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#e1cdb9]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#e1cdb9]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#e1cdb9]" />
                  </div>
                </div>
              </div>
            </Link>
          </article>
        );
      }),
    [items]
  );

  if (items.length === 0) {
    return (
      <p className="text-center text-[#7b6c61]">ยังไม่มีรายการสำหรับแสดง</p>
    );
  }

  return (
    <section className="relative">
      {/* แถบหัวข้อเล็กแบบแบรนด์ */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[#d8653b]" />
          <p className="text-sm text-[#7b6c61]">Slide to explore</p>
        </div>

        {/* ปุ่มเลื่อนซ้าย/ขวา */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scrollByCards(-1)}
            className="h-9 w-9 rounded-full bg-white ring-1 ring-[#eadfce] shadow hover:bg-[#fff7ee] transition"
            aria-label="เลื่อนไปซ้าย"
          >
            ‹
          </button>
          <button
            onClick={() => scrollByCards(1)}
            className="h-9 w-9 rounded-full bg-white ring-1 ring-[#eadfce] shadow hover:bg-[#fff7ee] transition"
            aria-label="เลื่อนไปขวา"
          >
            ›
          </button>
        </div>
      </div>

      {/* แทร็กสไลด์ */}
      <div
        ref={trackRef}
        onWheel={onWheel}
        className="no-scrollbar overflow-x-auto overflow-y-visible snap-x snap-mandatory"
      >
        <div className="flex gap-4 md:gap-5 pr-2">
          {cards}
          {/* การ์ดท้าย: CTA */}
          <div className="snap-start shrink-0 w-[60%] sm:w-[45%] md:w-[36%] lg:w-[28%] xl:w-[24%] 
                          rounded-3xl ring-1 ring-dashed ring-[#eadfce] bg-[#fffaf3]/70 
                          flex items-center justify-center">
            <Link
              to="/books"
              className="inline-flex items-center gap-2 h-12 px-5 rounded-full bg-white ring-1 ring-[#eadfce] text-[#5b4a3e] hover:bg-[#fff7ee] transition shadow-sm"
            >
              ดูทั้งหมดในคลัง
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-5 h-1 rounded-full bg-[#eadfce]/60 overflow-hidden">
        <div
          className="h-full bg-[#d8653b] transition-[width] duration-200"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </section>
  );
}
