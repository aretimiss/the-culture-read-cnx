// src/pages/HomePage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./HomePage.css";

import SiteHeader from "../components/SiteHeader";
import ParallaxHero from "../components/ParallaxHero";
import Footer from "../components/Footer";
import AutoCarousel from "../components/AutoCarousel";
import ArticlesBlock from "../components/ArticlesBlock"; // ✅ เพิ่ม

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
    // iOS background-attachment fix
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

      // 1) ลองดึงแบบตรงๆ ตามที่ตั้งใจ
      const [bks, manus, artsTry1] = await Promise.all([
        fetchItemsLite({ limit: 12, sortBy: "created", sortOrder: "desc", resource_class_label: "Book" }),
        fetchItemsLite({ limit: 16, sortBy: "created", sortOrder: "desc", resource_class_label: "Manuscript" }),
        fetchItemsLite({ limit: 24, sortBy: "created", sortOrder: "desc", resource_class_label: "Article" }),
      ]);

      // 2) ถ้า "Article" ว่าง ให้ลองสำรองด้วย resource_template_label บางชื่อที่พบบ่อย
      let arts = Array.isArray(artsTry1) ? artsTry1 : [];
      if (!arts.length) {
        const [tryTpl1, tryTpl2] = await Promise.all([
          // ปรับชื่อ template ให้ตรงกับที่คุณใช้จริงได้ เช่น "Article/Review", "กิจกรรม/บทความ"
          fetchItemsLite({ limit: 24, sortBy: "created", sortOrder: "desc", resource_template_label: "Article/Review" }),
          fetchItemsLite({ limit: 24, sortBy: "created", sortOrder: "desc", resource_template_label: "Article" }),
        ]);
        arts = [...(tryTpl1 || []), ...(tryTpl2 || [])];
      }

      // 3) ถ้ายังว่างอีก ให้ fallback เป็น "ล่าสุดทั้งหมด" แล้วกรอง client-side แบบเดาอย่างปลอดภัย
      if (!arts.length) {
        const latest = await fetchItemsLite({ limit: 60, sortBy: "created", sortOrder: "desc" });

        const looksLikeArticle = (it) => {
          const cls = it?.["o:resource_class"]?.["o:label"]?.toLowerCase?.() || "";
          if (cls.includes("article")) return true;

          // ดูจาก dcterms:type ที่มักจะกรอกระบุว่า "บทความ", "กิจกรรม", "ข่าว", ฯลฯ
          const types = Array.isArray(it?.["dcterms:type"])
            ? it["dcterms:type"].map((v) => (v?.["@value"] || "").toLowerCase())
            : [];
          if (types.some((s) => /article|บทความ|ข่าว|กิจกรรม|activity|news/i.test(s))) return true;

          // ถ้ามีคำอธิบาย แต่ไม่ใช่ Book/Manuscript ก็นับเป็นบทความ (heuristic)
          const hasDesc = Array.isArray(it?.["dcterms:description"]) && it["dcterms:description"].length > 0;
          const isBook = (cls.includes("book"));
          const isManuscript = (cls.includes("manuscript"));
          return hasDesc && !isBook && !isManuscript;
        };

        arts = (latest || []).filter(looksLikeArticle).slice(0, 24);
      }

      setBooks(Array.isArray(bks) ? bks : []);
      setManuscripts(Array.isArray(manus) ? manus : []);
      setArticles(Array.isArray(arts) ? arts : []);
    } catch (e) {
      setErr(e?.message || t("errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  })();
}, [i18n.language]);


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

  const booksFiltered = useMemo(() => filterByQuery(books).slice(0, 3), [books, query, i18n.language]); // 3 เล่มล่าสุด
  const manuscriptsFiltered = useMemo(
    () => filterByQuery(manuscripts).slice(0, 12),
    [manuscripts, query, i18n.language]
  );
  const articlesFiltered = useMemo(
    () => filterByQuery(articles).slice(0, 9),
    [articles, query, i18n.language]
  );

  /** ---------- สไลด์ Manuscript (คลิกทั้งภาพ/คีย์บอร์ด/ปัดได้) ---------- */
  const [msIndex, setMsIndex] = useState(0);
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
        {/* MANUSCRIPTS */}
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
          {/* Articles block (คอมโพเนนต์ใหม่) */}
          <ArticlesBlock
            title={t("sections.activities")}
            desc={t("sections.activitiesDesc")}
            items={articlesFiltered}
            loading={loading}
            err={err}
            onOpen={openPDF}
          />

          {/* Books carousel (3 เล่มล่าสุด) */}
          <aside className="rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm ring-1 ring-black/5">
            <AutoCarousel
              title={t("sections.recommendBooks")}
              items={loading || err ? [] : booksFiltered}
              onOpen={openPDF}
              className="h-[70vh] "
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
