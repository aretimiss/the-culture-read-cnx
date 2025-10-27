import React, { useEffect, useRef, useState } from "react";
import BookCard from "./BookCard";

/**
 * AutoCarousel: สไลด์หนังสือ 1 เล่มต่อสไลด์ พร้อมลูกศรซ้าย/ขวา
 */
export default function AutoCarousel({
  items = [],
  onOpen,
  intervalMs = 5000,
  showControls = true,
  className = "",
  title = "แนะนำหนังสือ",
}) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  const hasItems = items.length > 0;

  // ====== Auto play ======
  const start = () => {
    if (!hasItems) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIdx((n) => (n + 1) % items.length);
    }, intervalMs);
  };
  const stop = () => clearInterval(timerRef.current);

  useEffect(() => {
    start();
    return () => stop();
  }, [items.length, intervalMs]);

  // ====== Manual Controls ======
  const prev = () => setIdx((n) => (n - 1 + items.length) % items.length);
  const next = () => setIdx((n) => (n + 1) % items.length);

  // ====== Keyboard navigation ======
  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      stop();
      prev();
    } else if (e.key === "ArrowRight") {
      stop();
      next();
    }
  };

  return (
    <section
      className={`card-soft p-0 overflow-hidden relative group ${className}`}
      onMouseEnter={stop}
      onMouseLeave={start}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <header className="px-6 py-4 border-b border-black/10">
        <h3 className="text-xl md:text-2xl font-extrabold tracking-wide">
          {title}
        </h3>
      </header>

      {/* เนื้อหาสไลด์ */}
      <div className="relative h-[calc(100%-64px)] flex items-center justify-center">
        {hasItems ? (
          <div className="w-full h-full flex items-center justify-center transition-all duration-700">
            <div className="w-[90%] h-[90%] flex items-center justify-center">
              <BookCard
                item={items[idx]}
                onOpen={onOpen}
                compact={false}
              />
            </div>
          </div>
        ) : (
          <div className="p-10 text-center text-sm opacity-70">
            ไม่มีรายการ
          </div>
        )}

        {/* จุดบอกสถานะ (indicator) */}
        {hasItems && (
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1 pointer-events-none">
            {items.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? "w-6 bg-[#5b4a3e]" : "w-2 bg-black/20"
                }`}
              />
            ))}
          </div>
        )}

        {/* ปุ่มลูกศรซ้าย/ขวา */}
        {showControls && hasItems && (
          <>
            <button
              type="button"
              aria-label="ก่อนหน้า"
              onClick={() => {
                stop();
                prev();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 shadow ring-1 ring-black/10 hover:bg-white transition-opacity duration-300 opacity-0 group-hover:opacity-100"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <button
              type="button"
              aria-label="ถัดไป"
              onClick={() => {
                stop();
                next();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 shadow ring-1 ring-black/10 hover:bg-white transition-opacity duration-300 opacity-0 group-hover:opacity-100"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </>
        )}
      </div>
    </section>
  );
}
