import React, { useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import BookCard from "./BookCard";
import { titleOf, descOf } from "../lib/textOf";
import { pickLang } from "../lib/i18nPick";

/* ---------- ฟังก์ชันเลือกภาษาที่เข้มงวด ---------- */
const variantsFor = (lang) => {
  const L = (lang || "").toLowerCase();
  const map = {
    th: ["th", "tha", "th-th"],
    en: ["en", "eng", "en-us", "en-gb"],
    lo: ["lo", "lao", "lo-la"],
    tl: ["tl", "tgl", "fil", "fil-ph"],
    zh: ["zh", "zho", "zh-cn", "zh-hans", "zh-tw", "zh-hant"],
  };
  return map[L] || [L, `${L}-${L}`];
};

const pickLangStrict = (field, lang) => {
  if (!Array.isArray(field)) return "";
  const prefs = variantsFor(lang);
  for (const p of prefs) {
    const hit = field.find(
      (x) => (x?.["@language"] || "").toLowerCase() === p
    );
    if (hit?.["@value"]) return hit["@value"];
  }
  const loose = field.find((x) =>
    (x?.["@language"] || "").toLowerCase().startsWith(lang.toLowerCase())
  );
  return loose?.["@value"] || field[0]?.["@value"] || "";
};

/**
 * AutoCarousel: สไลด์หนังสือ 1 เล่มต่อสไลด์ พร้อมลูกศรซ้าย/ขวา
 * ✅ อัปเดตให้รองรับการเปลี่ยนภาษา
 */
export default function AutoCarousel({
  items = [],
  onOpen,
  intervalMs = 5000,
  showControls = true,
  className = "",
  title,
}) {
  const { t, i18n } = useTranslation();
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  const hasItems = items.length > 0;

  // ====== คำนวณชื่อ/คำโปรยตามภาษา ======
  const localizedItems = useMemo(() => {
    return (items || []).map((it) => {
      const localizedTitle =
        pickLangStrict(it?.["dcterms:title"], i18n.language) || titleOf(it);
      const localizedDesc =
        pickLangStrict(it?.["dcterms:description"], i18n.language) ||
        descOf(it);
      return {
        ...it,
        _title: localizedTitle,
        _desc: localizedDesc,
      };
    });
  }, [items, i18n.language]);

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

  // ====== เมื่อภาษาเปลี่ยน ให้รีเซ็ต index เพื่อ refresh การ์ด ======
  useEffect(() => {
    setIdx(0);
  }, [i18n.language]);

  // ====== Manual Controls ======
  const prev = () => setIdx((n) => (n - 1 + items.length) % items.length);
  const next = () => setIdx((n) => (n + 1) % items.length);

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
          {title || t("books.recommend", "แนะนำหนังสือ")}
        </h3>
      </header>

      {/* เนื้อหาสไลด์ */}
      <div className="relative h-[calc(100%-64px)] flex items-center justify-center">
        {hasItems ? (
          <div className="w-full h-full flex items-center justify-center transition-all duration-700">
            <div className="w-[90%] h-[90%] flex items-center justify-center">
              <BookCard
                key={`${localizedItems[idx]?._title}-${i18n.language}`}
                item={localizedItems[idx]}
                onOpen={onOpen}
                compact={false}
                /* ส่งชื่อ/คำโปรยที่เลือกตามภาษา */
                titleOverride={localizedItems[idx]?._title}
                descOverride={localizedItems[idx]?._desc}
              />
            </div>
          </div>
        ) : (
          <div className="p-10 text-center text-sm opacity-70">
            {t("status.loading", "กำลังโหลด...")}
          </div>
        )}

        {/* จุดบอกสถานะ */}
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
              aria-label={t("actions.prev", "ก่อนหน้า")}
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
              aria-label={t("actions.next", "ถัดไป")}
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
