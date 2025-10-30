// src/pages/BookArticleDetail.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import BackToTop from "../components/BackToTop";

import { api, fetchJsonWithProxies } from "../lib/omekaClient";
import { pickLang } from "../lib/i18nPick";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

/** helpers */
const normalizeHttps = (raw) =>
  raw ? (raw.startsWith("http://") ? raw.replace(/^http:/, "https:") : raw) : "";

const getValLang = (item, prop, fallback = "-") => {
  // ใช้ค่าแบบหลายภาษา (ถ้ามี) ก่อน แล้วค่อย fallback
  const v =
    pickLang(item?.[prop], i18n.language) ??
    item?.[prop]?.[0]?.["@value"] ??
    fallback;
  return v;
};

/** Small anchor-dot nav like Delassus */
function SectionDots({ sections }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id));
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (vis[0]) {
          const idx = els.findIndex((el) => el === vis[0].target);
          if (idx >= 0) setActive(idx);
        }
      },
      { root: null, threshold: [0.2, 0.5, 0.8] }
    );
    els.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [sections]);
  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <div className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-3">
      {sections.map((s, i) => (
        <button
          key={s.id}
          aria-label={`Go to ${s.label}`}
          onClick={() => scrollTo(s.id)}
          className={`w-3.5 h-3.5 rounded-full ring-1 ring-[#d6c8bb] transition-all ${
            i === active ? "bg-[#d8653b] scale-110" : "bg-[#efe7dd] hover:bg-[#e5d7ca]"
          }`}
        />
      ))}
    </div>
  );
}

/** Responsive image with gentle parallax */
function ParallaxImage({ src, alt, className = "" }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 20 });
  return (
    <motion.figure
      ref={ref}
      style={{ y: smoothY }}
      className={`overflow-hidden rounded-3xl ring-1 ring-[#eadfce] shadow-sm ${className}`}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
    </motion.figure>
  );
}

export default function BookArticleDetail() {
  const { t } = useTranslation();
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setErr(t("errors.loadFailed", "โหลดข้อมูลไม่สำเร็จ"));
      return;
    }
    let keep = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchJsonWithProxies(api(`/items/${id}`));
        if (!keep) return;
        setItem(data);

        const title =
          getValLang(data, "dcterms:title", data?.["o:title"] || "Book");
        document.title = `${title} · ${t("book.showcase", "Showcase")}`;
      } catch (e) {
        if (keep) setErr(e?.message || t("errors.loadFailed", "โหลดข้อมูลไม่สำเร็จ"));
      } finally {
        if (keep) setLoading(false);
      }
    })();
    return () => {
      keep = false;
    };
  }, [id, t]);

  const meta = useMemo(() => {
    if (!item) return {};
    const cover =
      item?.thumbnail_display_urls?.large ||
      item?.thumbnail_display_urls?.medium ||
      "/assets/placeholder.webp";

    const title =
      getValLang(item, "dcterms:title", item?.["o:title"] || t("book.untitled", "Untitled"));
    const lang = getValLang(item, "dcterms:language", "und");
    const publisher = getValLang(item, "dcterms:publisher", "-");
    const date = getValLang(item, "dcterms:date", "-");
    const creator = getValLang(item, "dcterms:creator", "-");
    const type = getValLang(item, "dcterms:type", t("book.type", "Book"));
    const extent = getValLang(item, "dcterms:extent", "");
    const rights = getValLang(item, "dcterms:rights", "");

    // บทความ/คำโปรยหลายภาษา
    const descList = Array.isArray(item?.["dcterms:description"])
      ? item["dcterms:description"].map((d) => d?.["@value"]).filter(Boolean)
      : [];

    return { cover, lang, publisher, date, creator, type, extent, rights, title, descList };
  }, [item, t]);

  const sections = [
    { id: "ov", label: t("book.overview", "Overview") },
    { id: "facts", label: t("book.keyFacts", "Key Facts") },
    { id: "author", label: t("book.author", "Author") },
    { id: "excerpt", label: t("book.excerpts", "Excerpts") },
    { id: "gallery", label: t("book.gallery", "Gallery") },
    { id: "cta", label: t("actions.read", "Read") },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf7f2] text-[#1b1b1b]">
        <SiteHeader />
        <main className="pt-28 grid place-items-center text-[#7b6c61]">
          {t("status.loading", "กำลังโหลด…")}
        </main>
        <Footer />
      </div>
    );
  }
  if (err) {
    return (
      <div className="min-h-screen bg-[#faf7f2] text-[#1b1b1b]">
        <SiteHeader />
        <main className="pt-28 grid place-items-center text-red-700">{err}</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#1b1b1b]">
      <SiteHeader />
      <SectionDots sections={sections} />

      {/* HERO */}
      <header id="ov" className="pt-28 md:pt-32 pb-8">
        <div className="max-w-7xl mx-auto px-5 md:px-8 grid md:grid-cols-2 gap-6 md:gap-10 items-center">
          <ParallaxImage
            src={normalizeHttps(meta.cover)}
            alt={meta.title || "cover"}
            className="aspect-[3/4]"
          />
          <div>
            <p className="text-sm tracking-widest uppercase text-[#a5866e] mb-3">
              {t("book.featured", "Featured Book")}
            </p>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-[#5b4a3e]">
              {meta.title || t("book.untitled", "Untitled")}
            </h1>
            <p className="mt-4 text-[15px] leading-7 text-[#5b4a3e] opacity-90 max-w-prose">
              {meta.descList?.[0] ||
                t(
                  "book.placeholderIntro",
                  "A striking showcase section with clean typography and generous white space, inspired by Delassus."
                )}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[meta.type || t("book.type", "Book"), meta.lang || "und", meta.date || "-"].map(
                (t0) => (
                  <span
                    key={t0}
                    className="px-3 py-1 rounded-full bg-[#fffaf3] ring-1 ring-[#eadfce] text-sm text-[#5b4a3e]"
                  >
                    {t0}
                  </span>
                )
              )}
            </div>
            <div className="mt-8 flex gap-3 flex-wrap">
              <Link
                to={id ? `/read/${id}` : "#"}
                className="px-5 py-2.5 rounded-xl bg-[#d8653b] text-white shadow hover:opacity-95"
              >
                {t("actions.readNow", "Read now")}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* KEY FACTS */}
      <section id="facts" className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-5 md:px-8 grid md:grid-cols-12 gap-6">
          <div className="md:col-span-5">
            <div className="rounded-3xl bg-[#fffaf3] ring-1 ring-[#eadfce] p-6 md:p-8 shadow-sm">
              <h2 className="text-2xl md:text-3xl font-bold text-[#5b4a3e] mb-4">
                {t("book.details", "Details")}
              </h2>
              <dl className="grid grid-cols-2 gap-4 text-sm text-[#57493f]">
                <div>
                  <dt className="opacity-60">{t("book.author", "Author")}</dt>
                  <dd className="font-medium">{meta.creator}</dd>
                </div>
                <div>
                  <dt className="opacity-60">{t("book.published", "Published")}</dt>
                  <dd className="font-medium">{meta.date}</dd>
                </div>
                <div>
                  <dt className="opacity-60">{t("book.publisher", "Publisher")}</dt>
                  <dd className="font-medium">{meta.publisher}</dd>
                </div>
                <div>
                  <dt className="opacity-60">{t("book.language", "Language")}</dt>
                  <dd className="font-medium">{meta.lang}</dd>
                </div>
                {meta.extent && (
                  <div>
                    <dt className="opacity-60">{t("book.extent", "Extent")}</dt>
                    <dd className="font-medium">{meta.extent}</dd>
                  </div>
                )}
                {meta.rights && (
                  <div className="col-span-2">
                    <dt className="opacity-60">{t("book.rights", "Rights")}</dt>
                    <dd className="font-medium">{meta.rights}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
          <div className="md:col-span-7">
            <ParallaxImage
              src={normalizeHttps(meta.cover)}
              alt="cover large"
              className="aspect-[21/9]"
            />
          </div>
        </div>
      </section>

      {/* AUTHOR */}
      <section id="author" className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-5 md:px-8 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#5b4a3e] mb-4">
              {t("book.aboutAuthor", "About the author")}
            </h2>
            <p className="text-[#57493f] leading-8">
              {meta.creator && meta.creator !== "-" ? `${meta.creator} —` : t("book.authorDash", "The author —")}{" "}
              {t(
                "book.authorBlurb",
                "This section mirrors Delassus-style editorial blocks: big headings, calm colors, and soft card edges. Replace with the author's biography or context of the work."
              )}
            </p>
          </div>
          <ParallaxImage
            src={normalizeHttps(meta.cover)}
            alt="author related"
            className="aspect-video"
          />
        </div>
      </section>

      {/* EXCERPTS */}
      <section id="excerpt" className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="rounded-3xl ring-1 ring-[#eadfce] bg-white p-6 md:p-10 shadow-sm">
            <h2 className="text-2xl md:text-3xl font-bold text-[#5b4a3e] mb-6">
              {t("book.highlighted", "Highlighted excerpts")}
            </h2>

            {(() => {
              const excerpts =
                (meta.descList?.slice(0, 3)?.length
                  ? meta.descList.slice(0, 3)
                  : [
                      t("book.ex1", "An opening that sets the tone for discovery and cultural memory."),
                      t("book.ex2", "A paragraph that reveals the texture of place and people."),
                      t("book.ex3", "A passage whose cadence lingers beyond the page."),
                    ]) ?? [];

              const gridCols =
                excerpts.length <= 1
                  ? "grid-cols-1"
                  : excerpts.length === 2
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

              return (
                <div className={`grid ${gridCols} gap-6 md:gap-8`}>
                  {excerpts.map((t0, i) => (
                    <blockquote
                      key={i}
                      className="h-full rounded-2xl bg-[#fffaf3] ring-1 ring-[#eadfce] p-5 md:p-6 text-[#3f342d]
                                 text-[15px] md:text-base leading-7 md:leading-8 shadow-[0_1px_0_#eadfce] flex"
                      style={{ hyphens: "auto" }}
                    >
                      <p className="m-0 [text-wrap:pretty]">
                        <span className="text-[#d8653b] mr-2 select-none">“</span>
                        {t0}
                        <span className="text-[#d8653b] ml-1 select-none">”</span>
                      </p>
                    </blockquote>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#5b4a3e] mb-6">
            {t("book.gallery", "Gallery")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ParallaxImage
                key={i}
                src={normalizeHttps(meta.cover)}
                alt={`page-${i + 1}`}
                className="aspect-[3/4]"
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="py-16">
        <div className="max-w-5xl mx-auto px-5 md:px-8 text-center">
          <div className="rounded-3xl bg-[#fffaf3] ring-1 ring-[#eadfce] p-10 shadow">
            <h3 className="text-2xl md:text-3xl font-bold text-[#5b4a3e]">
              {t("book.readNowTitle", "Read the book now")}
            </h3>
            <p className="text-[#57493f] mt-2">{t("book.readNowDesc", "ข้อความเชิญชวนบลาๆ.")}</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                to={id ? `/read/${id}` : "#"}
                className="px-5 py-2.5 rounded-xl bg-[#d8653b] text-white shadow hover:opacity-95"
              >
                {t("actions.openReader", "Open Reader")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <BackToTop />
    </div>
  );
}
