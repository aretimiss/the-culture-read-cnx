// src/components/ArticlesBlock.jsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { pickLang } from "../lib/i18nPick";

/** พาเลตต์สีวนแบบเดียวกับ BookArticlesPage */
const BG_PALETTE = [
  { bg: "#ff8a3d", text: "#ffffff" },
  { bg: "#f6d4b1", text: "#5b4a3e" },
  { bg: "#f0c2a8", text: "#5b4a3e" },
  { bg: "#ffd7a0", text: "#5b4a3e" },
  { bg: "#ffe9d6", text: "#5b4a3e" },
];

export default function ArticlesBlock({ title, desc, items = [], loading, err, onOpen }) {
  const { t } = useTranslation();

  // ---------- MOBILE: index ทีละ 1 ----------
  const [mIndex, setMIndex] = useState(0);
  const mItems = items.slice(0, 60);
  const mCurrent = useMemo(() => mItems[mIndex], [mItems, mIndex]);
  const mNext = () => setMIndex((i) => (mItems.length ? (i + 1) % mItems.length : 0));
  const mPrev = () =>
    setMIndex((i) => (mItems.length ? (i - 1 + mItems.length) % mItems.length : 0));

  // ---------- DESKTOP: หน้า (page) ละ 2 ----------
  const PAGE_SIZE = 2;
  const dItems = items.slice(0, 60);
  const totalPages = Math.max(1, Math.ceil(dItems.length / PAGE_SIZE));

  const [page, setPage] = useState(0); // 0 = ล่าสุด (หน้าแรก)
  const start = page * PAGE_SIZE;
  const pageItems = dItems.slice(start, start + PAGE_SIZE);

  const go = (p) => setPage(Math.max(0, Math.min(totalPages - 1, p)));
  const newer = () => go(page - 1); // ไป "ใหม่กว่า"
  const older = () => go(page + 1); // ไป "เก่ากว่า"

  return (
    <section className="rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm ring-1 ring-black/5">
      <div className="px-5 pt-6 pb-2 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#5b4a3e]">
          {title}
        </h2>
        {desc && <p className="text-sm sm:text-base text-black/70 mt-2">{desc}</p>}
      </div>

      <div className="px-5 pb-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="art-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-4"
            >
              {Array.from({ length: 2 }).map((_, i) => ( // << 2 แถวให้ตรง PAGE_SIZE
                <SkeletonRow key={i} />
              ))}
            </motion.div>
          ) : err ? (
            <motion.p
              key="art-err"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-red-600"
            >
              {t("errors.loadFailed")}
            </motion.p>
          ) : items.length === 0 ? (
            <motion.p
              key="art-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-black/60"
            >
              {t("common.emptyArticles")}
            </motion.p>
          ) : (
            <motion.div key={`art-page-${page}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* เดสก์ท็อป: 1 แถว/บทความ, หน้า/ละ 2 ชิ้น, เพจิเนชัน */}
              <div className="hidden sm:flex flex-col gap-5">
                {pageItems.map((it, i) => (
                  <ArticleRow
                    key={it["o:id"]}
                    item={it}
                    paletteIndex={(start + i) % BG_PALETTE.length}
                    onOpen={onOpen}
                  />
                ))}

                {/* Pagination controls */}
                <div className="mt-2 flex items-center justify-between">
                  <button
                    onClick={newer}
                    disabled={page === 0}
                    className={`h-9 px-4 rounded-full text-sm ring-1 transition ${
                      page === 0
                        ? "opacity-40 cursor-not-allowed ring-black/10"
                        : "ring-black/10 hover:bg-black/5"
                    }`}
                  >
                    {t("common.newer", "Newer")}
                  </button>

                  <div className="flex gap-1.5">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => go(i)}
                        aria-current={i === page ? "true" : "false"}
                        className={`h-2.5 w-2.5 rounded-full ${
                          i === page ? "bg-[#5b4a3e]" : "bg-black/20 hover:bg-black/30"
                        }`}
                        title={`${t("common.page", "Page")} ${i + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={older}
                    disabled={page >= totalPages - 1}
                    className={`h-9 px-4 rounded-full text-sm ring-1 transition ${
                      page >= totalPages - 1
                        ? "opacity-40 cursor-not-allowed ring-black/10"
                        : "ring-black/10 hover:bg-black/5"
                    }`}
                  >
                    {t("common.older", "Older")}
                  </button>
                </div>
              </div>

              {/* มือถือ: สไลด์ทีละ 1 + ลูกศร + จุด */}
              <div className="sm:hidden relative">
                <div className="relative overflow-hidden rounded-xl ring-1 ring-black/5">
                  {/* สูงขึ้นบนจอเล็ก เพื่อไม่ให้เนื้อหาดันปุ่มหลุดกรอบ */}
                  <div className="aspect-[4/5] sm:aspect-[16/11] w-full">
                    <MobileArticleSlide item={mCurrent} />
                  </div>

                  {/* ลูกศร: ไม่บังองค์ประกอบอื่น */}
                  <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                    <button
                      aria-label={t("carousel.prev")}
                      onClick={mPrev}
                      className="h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 text-white grid place-items-center pointer-events-auto"
                    >
                      ‹
                    </button>
                    <button
                      aria-label={t("carousel.next")}
                      onClick={mNext}
                      className="h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 text-white grid place-items-center pointer-events-auto"
                    >
                      ›
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-center gap-1.5">
                  {mItems.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setMIndex(i)}
                      className={`h-2.5 w-2.5 rounded-full ${
                        i === mIndex ? "bg-[#5b4a3e]" : "bg-black/20"
                      }`}
                      aria-label={t("carousel.goToSlide", { n: i + 1 })}
                      aria-current={i === mIndex ? "true" : "false"}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ===== การ์ดแนวนอน 1 แถว/บทความ (เดสก์ท็อป) ===== */
function ArticleRow({ item, paletteIndex = 0, onOpen }) {
  const { t } = useTranslation();
  const lang = (i18n.language || "th").split("-")[0];
  const id = item?.["o:id"];
  const title = (pickLang(item?.["dcterms:title"], lang) || "").trim() || `#${id}`;
  const rawDesc = pickLang(item?.["dcterms:description"], lang) || "";

  // clean text
  const tmp = document.createElement("div");
  tmp.innerHTML = rawDesc;
  const clean = (tmp.textContent || tmp.innerText || "").trim();
  const desc = clean.length > 220 ? clean.slice(0, 220) + "…" : clean;

  const { bg, text } = BG_PALETTE[paletteIndex % BG_PALETTE.length];
  const isLight = text.toLowerCase() === "#ffffff";

  return (
    <article
      className="group relative rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden transition hover:shadow-md"
      style={{ background: bg, color: text }}
    >
      <div className="flex flex-col sm:flex-row items-stretch">
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-semibold leading-snug">{title}</h3>
            {desc && (
              <p className="mt-3 text-sm/relaxed opacity-90 max-w-3xl line-clamp-3">
                {desc}
              </p>
            )}
          </div>

          <div className="mt-5 flex gap-3 flex-wrap">
            <button
              onClick={() => onOpen?.(item)}
              className={`h-10 px-5 rounded-full text-sm font-semibold shadow transition ${
                isLight ? "bg-white text-[#5b4a3e]" : "bg-[#d8653b] text-white"
              }`}
            >
              {t("actions.readNow", "อ่านเลย")}
            </button>
            <Link
              to={`/book/${id}`}
              className={`h-10 px-5 rounded-full text-sm grid place-items-center ring-1 transition ${
                isLight
                  ? "bg-white/10 text-white ring-white/40 hover:bg-white/20"
                  : "bg-black/10 text-[#5b4a3e] ring-black/10 hover:bg-black/20"
              }`}
            >
              Details
            </Link>
          </div>
        </div>

        {/* ลายพื้นหลังด้านขวาเบา ๆ */}
        <div
          className="hidden sm:block sm:w-[30%] relative bg-gradient-to-br from-black/5 to-transparent"
          aria-hidden="true"
        />
      </div>
    </article>
  );
}

/* ===== สไลด์บทความ (มือถือ) ===== */
function MobileArticleSlide({ item }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  if (!item) return <div className="w-full h-full bg-white" />;

  const id = item["o:id"];
  const lang = (i18n.language || "th").split("-")[0];
  const title = (pickLang(item?.["dcterms:title"], lang) || "").trim() || `#${id}`;
  const rawDesc = pickLang(item?.["dcterms:description"], lang) || "";

  const tmp = document.createElement("div");
  tmp.innerHTML = rawDesc;
  const clean = (tmp.textContent || tmp.innerText || "").trim();
  const desc = clean.length > 180 ? clean.slice(0, 180) + "…" : clean;

  const { bg, text } = BG_PALETTE[id % BG_PALETTE.length];
  const isLight = text.toLowerCase() === "#ffffff";

  return (
    <div
      className="w-full h-full p-4 flex flex-col pb-[env(safe-area-inset-bottom)]"
      style={{ background: bg, color: text }}
    >
      <h3 className="font-semibold line-clamp-2 break-words">{title}</h3>
      {desc && (
        <p className="mt-2 text-sm leading-relaxed opacity-90 line-clamp-3 md:line-clamp-5 break-words">
          {desc}
        </p>
      )}

      {/* ตรึงปุ่มไว้ก้นการ์ดเสมอ */}
      <div className="mt-auto pt-3 flex gap-2">
        <button
          onClick={() => navigate(`/read/${id}`)}
          className={`h-10 px-5 rounded-full text-sm font-semibold shadow ${
            isLight ? "bg-white text-[#5b4a3e]" : "bg-[#d8653b] text-white"
          }`}
        >
          {t("actions.readNow", "Read now")}
        </button>
        <Link
          to={`/book/${id}`}
          className={`h-10 px-5 rounded-full text-sm grid place-items-center ring-1 ${
            isLight ? "bg-white/10 text-white ring-white/40" : "bg-black/10 text-[#5b4a3e] ring-black/10"
          }`}
        >
          Details
        </Link>
      </div>
    </div>
  );
}

/* ===== โครงกระดูกตอนโหลด (แถวเดียว) ===== */
function SkeletonRow() {
  return (
    <div className="rounded-2xl ring-1 ring-black/5 p-6 bg-white/70">
      <div className="h-5 w-2/3 bg-neutral-100 rounded animate-pulse" />
      <div className="mt-3 h-4 w-5/6 bg-neutral-100 rounded animate-pulse" />
      <div className="mt-2 h-4 w-1/2 bg-neutral-100 rounded animate-pulse" />
      <div className="mt-4 flex gap-2">
        <div className="h-9 w-24 bg-neutral-100 rounded-full animate-pulse" />
        <div className="h-9 w-24 bg-neutral-100 rounded-full animate-pulse" />
      </div>
    </div>
  );
}
