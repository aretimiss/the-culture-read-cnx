// src/pages/HomePage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./HomePage.css";

import SiteHeader from "../components/SiteHeader";
import ParallaxHero from "../components/ParallaxHero";
import Footer from "../components/Footer";
import AutoCarousel from "../components/AutoCarousel";

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { fetchItemsLite, thumbUrlOf } from "../lib/omekaClient";
import { pickLang } from "../lib/i18nPick";

/** ===== helpers (ไม่ใช้ description) ===== */
const getVals = (it, prop) =>
  Array.isArray(it?.[prop]) ? it[prop].map((v) => v?.["@value"]).filter(Boolean) : [];

const getLangVals = (it, prop, lang) =>
  Array.isArray(it?.[prop])
    ? it[prop]
        .map((v) => (v?.["@language"] ? (v["@language"] === lang ? v["@value"] : null) : v?.["@value"]))
        .filter(Boolean)
    : [];

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ชุดข้อมูลตามหมวด
  const [books, setBooks] = useState([]);
  const [manuscripts, setManuscripts] = useState([]);
  const [articles, setArticles] = useState([]);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ใช้ภาษาหลัก (ตัด region ออก เช่น th-TH -> th)
  const langBase = (i18n.language || "th").split("-")[0];

  // multi-lang title/desc
  const titleOfItem = (it) => pickLang(it?.["dcterms:title"], langBase) || "";
  const descOfItem = (it) => pickLang(it?.["dcterms:description"], langBase) || "";

  const openPDF = (item) => {
    const id = item?.["o:id"];
    if (!id) return alert(t("errors.noId"));
    navigate(`/read/${id}`);
  };

  useEffect(() => {
    // background-attachment fix (iOS)
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () =>
      document.documentElement.style.setProperty("--bg-attach", mq.matches ? "scroll" : "fixed");
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const [bks, manus, arts] = await Promise.all([
          fetchItemsLite({ limit: 12, sortBy: "created", sortOrder: "desc", resource_class_label: "Book" }),
          fetchItemsLite({ limit: 16, sortBy: "created", sortOrder: "desc", resource_class_label: "Manuscript" }),
          fetchItemsLite({ limit: 12, sortBy: "created", sortOrder: "desc", resource_class_label: "Article" }),
        ]);

        setBooks(Array.isArray(bks) ? bks : []);
        setManuscripts(Array.isArray(manus) ? manus : []);
        setArticles(Array.isArray(arts) ? arts : []);
      } catch (e) {
        setErr(e?.message || t("errors.loadFailed"));
      } finally {
        setLoading(false);
      }
    })();
  }, [i18n.language]); // เปลี่ยนภาษาแล้วโหลดใหม่

  // filter in-page
  const filterByQuery = (arr) => {
    if (!query.trim()) return arr || [];
    const q = query.toLowerCase();
    return (arr || []).filter((it) => {
      const t0 = (titleOfItem(it) || "").toLowerCase();
      const d0 = (descOfItem(it) || "").toLowerCase();
      return t0.includes(q) || d0.includes(q);
    });
  };

  const booksFiltered = useMemo(() => filterByQuery(books).slice(0, 3), [books, query, i18n.language]); // ✅ 3 เล่มล่าสุด
  const manuscriptsFiltered = useMemo(
    () => filterByQuery(manuscripts).slice(0, 12),
    [manuscripts, query, i18n.language]
  );
  const articlesFiltered = useMemo(
    () => filterByQuery(articles).slice(0, 9),
    [articles, query, i18n.language]
  );

  /** ---------- สไลด์ฝั่ง Manuscript: ปัดได้ / ลูกศรคีย์บอร์ด / โฟกัสได้ ---------- */
  const [msIndex, setMsIndex] = useState(0);
  useEffect(() => setMsIndex(0), [manuscriptsFiltered.length]); // รีเซ็ตเมื่อรายการเปลี่ยน
  const currentMs = manuscriptsFiltered[msIndex];

  const [currentThumb, setCurrentThumb] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const u = currentMs ? await thumbUrlOf(currentMs) : null;
      if (alive) setCurrentThumb(u);
    })();
    return () => {
      alive = false;
    };
  }, [currentMs]);

  const nextMs = () =>
    setMsIndex((i) => (manuscriptsFiltered.length ? (i + 1) % manuscriptsFiltered.length : 0));
  const prevMs = () =>
    setMsIndex((i) =>
      manuscriptsFiltered.length ? (i - 1 + manuscriptsFiltered.length) % manuscriptsFiltered.length : 0
    );
  const jumpMs = (i) => setMsIndex(i);

  // touch swipe
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    const THRESHOLD = 40;
    if (touchDeltaX.current > THRESHOLD) prevMs();
    else if (touchDeltaX.current < -THRESHOLD) nextMs();
  };

  // keyboard arrows
  const sliderRef = useRef(null);
  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") prevMs();
    if (e.key === "ArrowRight") nextMs();
  };

  // fields (ยังไม่ใช้แสดงผล แต่เผื่ออนาคต)
  const manuFields = useMemo(() => {
    const it = currentMs || {};
    const lang = langBase;
    const joiner = (arr) => (arr && arr.length ? arr.join(", ") : "—");
    return [
      { label: t("book.author"), value: joiner(getLangVals(it, "dcterms:creator", lang) || getVals(it, "dcterms:creator")) },
      { label: t("book.published"), value: joiner(getVals(it, "dcterms:date")) },
      { label: t("book.language"), value: joiner(getVals(it, "dcterms:language")) },
      { label: t("sections.rareBooks"), value: joiner(getLangVals(it, "dcterms:subject", lang) || getVals(it, "dcterms:subject")) },
      { label: t("book.details"), value: joiner(getLangVals(it, "dcterms:spatial", lang) || getVals(it, "dcterms:spatial")) },
      { label: t("book.publisher"), value: joiner(getLangVals(it, "dcterms:publisher", lang) || getVals(it, "dcterms:publisher")) },
      { label: "ID", value: it?.["o:id"] ?? "—" },
    ];
  }, [currentMs, langBase, t]);

  return (
    <div
      className="min-h-screen text-[#111518]"
      style={{
        backgroundImage: "url('/assets/banner.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "var(--bg-attach, fixed)",
      }}
    >
      <SiteHeader />

      {/* Banner + Search */}
      <ParallaxHero
        banner=""
        onSearch={setQuery}
        searchPlaceholder={t("search.placeholder")}
      />

      {/* ===== Layout: Manuscripts + (Articles | Books) ===== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 space-y-10">
        {/* ===== MANUSCRIPTS (Full Image Clickable) ===== */}
        <section className="rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm ring-1 ring-black/5">
          <div className="px-5 pt-6 pb-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#5b4a3e] text-center">
              {t("sections.ancientDocs")}
            </h2>
          </div>

          <div className="px-5 pb-6">
            <div
              ref={sliderRef}
              tabIndex={0}
              onKeyDown={onKeyDown}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              aria-roledescription="carousel"
              aria-label={t("sections.ancientDocs")}
              className="relative rounded-xl overflow-hidden ring-1 ring-black/5 bg-white"
            >
              <div
                className="aspect-video w-full cursor-pointer"
                onClick={() => currentMs && openPDF(currentMs)}
              >
                {loading ? (
                  <div className="w-full h-full animate-pulse bg-neutral-100" aria-label={t("status.loading")} />
                ) : currentThumb ? (
                  <img
                    src={currentThumb}
                    alt={titleOfItem(currentMs) || ""}
                    className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-[1.02]"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-black/40 text-sm">
                    {t("common.noImage")}
                  </div>
                )}
              </div>

              {/* controls */}
              <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                <button
                  type="button"
                  onClick={prevMs}
                  className="pointer-events-auto h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white grid place-items-center outline-none focus:ring-2 focus:ring-white/80"
                  aria-label={t("carousel.prev")}
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={nextMs}
                  className="pointer-events-auto h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white grid place-items-center outline-none focus:ring-2 focus:ring-white/80"
                  aria-label={t("carousel.next")}
                >
                  ›
                </button>
              </div>

              {/* dots */}
              <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5">
                {manuscriptsFiltered.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => jumpMs(i)}
                    className={`h-2.5 w-2.5 rounded-full outline-none focus:ring-2 focus:ring-white/80 ${
                      i === msIndex ? "bg-white" : "bg-white/50 hover:bg-white/80"
                    }`}
                    aria-label={t("carousel.goToSlide", { n: i + 1 })}
                    aria-current={i === msIndex ? "true" : "false"}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== BOTTOM ROW: Articles | Books ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Articles */}
          <section className="rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm ring-1 ring-black/5">
            <div className="px-5 pt-6 pb-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#5b4a3e] text-center">
                {t("sections.activities")}
              </h2>
              <p className="text-center mt-2 text-sm sm:text-base text-black/70">
                {t("sections.activitiesDesc")}
              </p>
            </div>

            <div className="px-5 pb-6">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="border rounded-xl p-4 bg-white ring-1 ring-black/5">
                      <div className="h-5 bg-neutral-100 animate-pulse rounded w-2/3" />
                      <div className="mt-3 space-y-2">
                        <div className="h-3 bg-neutral-100 animate-pulse rounded" />
                        <div className="h-3 bg-neutral-100 animate-pulse rounded w-5/6" />
                        <div className="h-3 bg-neutral-100 animate-pulse rounded w-4/6" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : articlesFiltered.slice(0, 6).length === 0 ? (
                <p className="text-center text-sm text-black/60">{t("common.emptyArticles")}</p>
              ) : (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {articlesFiltered.slice(0, 6).map((it) => (
                    <button
                      key={it["o:id"]}
                      type="button"
                      onClick={() => openPDF(it)}
                      className="group border rounded-xl p-4 bg-white hover:bg-neutral-50 text-left transition shadow-sm ring-1 ring-black/5 outline-none focus-visible:ring-2 focus-visible:ring-[#111518]/20"
                      title={titleOfItem(it)}
                    >
                      <div className="font-semibold text-[#111518] line-clamp-2 group-hover:underline">
                        {titleOfItem(it) || "—"}
                      </div>
                      <div className="mt-2 text-xs text-black/60 line-clamp-3">
                        {descOfItem(it) || ""}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Books carousel (3 เล่มล่าสุด) */}
          <aside className="rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm ring-1 ring-black/5">
            <AutoCarousel
              title={t("sections.recommendBooks")}
              items={loading || err ? [] : booksFiltered /* <= 3 เล่ม */}
              onOpen={openPDF}
              // เดิมใช้ h-80% ซึ่งไม่ใช่คลาสของ Tailwind → ใช้ความสูงที่ชัดเจนแทน
              className="h-70%"
            />
            {!loading && !err && booksFiltered.length === 0 && (
              <p className="px-5 pb-6 text-center text-sm text-black/60">{t("common.emptyBooks")}</p>
            )}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
