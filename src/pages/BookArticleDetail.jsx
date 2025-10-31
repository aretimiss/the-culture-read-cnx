import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from "framer-motion";
import { useTranslation } from "react-i18next";

import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import BackToTop from "../components/BackToTop";

import { api, fetchJsonWithProxies } from "../lib/omekaClient";
import {
  titleOf,
  descOf,
  creatorOf,
  dateOf,
  publisherOf,
  rightsOf,
  extentOf,
  languageOf,
  typeOf,
  subjectOf,
} from "../lib/textOf";

/* helpers */
const normalizeHttps = (u) =>
  u ? (u.startsWith("http://") ? u.replace(/^http:/, "https:") : u) : "";

/* Skeleton Loader (ใช้ตอนเปลี่ยนภาษา / โหลดข้อมูล) */
function SkeletonDetail() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#faf7f2] text-[#5b4a3e] animate-pulse">
      <div className="h-8 w-48 bg-[#e5d7ca]/50 rounded-full mb-4"></div>
      <div className="h-6 w-80 bg-[#e5d7ca]/40 rounded-full mb-2"></div>
      <div className="h-6 w-72 bg-[#e5d7ca]/40 rounded-full mb-2"></div>
      <div className="h-5 w-64 bg-[#e5d7ca]/30 rounded-full mb-6"></div>
      <div className="flex gap-3 mt-6">
        <div className="h-40 w-28 bg-[#e5d7ca]/40 rounded-xl"></div>
        <div className="h-40 w-28 bg-[#e5d7ca]/40 rounded-xl"></div>
      </div>
    </div>
  );
}

/* Parallax Image */
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
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchJsonWithProxies(api(`/items/${id}`));
        if (!alive) return;
        setItem(data);
        document.title = `${titleOf(data)} · ${t("book.showcase", "Showcase")}`;
      } catch (e) {
        if (alive) setErr(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, i18n.language]); // ✅ โหลดใหม่ทุกครั้งเมื่อเปลี่ยนภาษา

  const meta = useMemo(() => {
    if (!item) return {};
    return {
      cover:
        item?.thumbnail_display_urls?.large ||
        item?.thumbnail_display_urls?.medium ||
        "/assets/placeholder.webp",
      title: titleOf(item),
      desc: descOf(item),
      creator: creatorOf(item),
      date: dateOf(item),
      publisher: publisherOf(item),
      rights: rightsOf(item),
      extent: extentOf(item),
      lang: languageOf(item),
      type: typeOf(item),
      subject: subjectOf(item),
    };
  }, [item, i18n.language]); // ✅ meta รีเฟรชเมื่อเปลี่ยนภาษา

  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#1b1b1b]">
      <SiteHeader />

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <SkeletonDetail />
          </motion.div>
        ) : err ? (
          <motion.div
            key="error"
            className="min-h-screen grid place-items-center text-red-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {t("errors.loadFailed", "โหลดข้อมูลไม่สำเร็จ")}
          </motion.div>
        ) : (
          <motion.div
            key={i18n.language}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* HERO */}
            <header className="pt-28 pb-10">
              <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
                <ParallaxImage src={normalizeHttps(meta.cover)} alt="cover" className="aspect-[3/4]" />
                <div>
                  <p className="uppercase text-[#a5866e] tracking-widest text-sm mb-2">
                    {t("book.featured", "Featured Book")}
                  </p>
                  <h1 className="text-4xl md:text-5xl font-bold text-[#5b4a3e] mb-4">
                    {meta.title}
                  </h1>
                  <p className="text-[#57493f] text-[15px] leading-7">{meta.desc}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {[meta.type, meta.lang, meta.date].map(
                      (t0, idx) =>
                        t0 && (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-full bg-[#fffaf3] ring-1 ring-[#eadfce] text-sm text-[#5b4a3e]"
                          >
                            {t0}
                          </span>
                        )
                    )}
                  </div>
                  <Link
                    to={`/read/${id}`}
                    className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-[#d8653b] text-white shadow hover:opacity-95"
                  >
                    {t("actions.readNow", "Read now")}
                  </Link>
                </div>
              </div>
            </header>

            {/* DETAILS */}
            <section className="py-10">
              <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-8">
                <div className="rounded-3xl bg-[#fffaf3] ring-1 ring-[#eadfce] p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-[#5b4a3e] mb-4">
                    {t("book.details", "Book Details")}
                  </h2>
                  <dl className="grid grid-cols-2 gap-4 text-sm text-[#57493f]">
                    <div><dt className="opacity-60">{t("book.author", "Author")}</dt><dd>{meta.creator}</dd></div>
                    <div><dt className="opacity-60">{t("book.publisher", "Publisher")}</dt><dd>{meta.publisher}</dd></div>
                    <div><dt className="opacity-60">{t("book.date", "Date")}</dt><dd>{meta.date}</dd></div>
                    <div><dt className="opacity-60">{t("book.language", "Language")}</dt><dd>{meta.lang}</dd></div>
                    {meta.extent && <div><dt className="opacity-60">{t("book.extent", "Extent")}</dt><dd>{meta.extent}</dd></div>}
                    {meta.subject && <div className="col-span-2"><dt className="opacity-60">{t("book.subject", "Subject")}</dt><dd>{meta.subject}</dd></div>}
                    {meta.rights && <div className="col-span-2"><dt className="opacity-60">{t("book.rights", "Rights")}</dt><dd>{meta.rights}</dd></div>}
                  </dl>
                </div>
                <ParallaxImage src={normalizeHttps(meta.cover)} alt="detail" className="aspect-video" />
              </div>
            </section>

            {/* CTA */}
            <section className="py-16 text-center">
              <div className="max-w-3xl mx-auto bg-[#fffaf3] ring-1 ring-[#eadfce] rounded-3xl shadow p-10">
                <h3 className="text-2xl font-bold text-[#5b4a3e] mb-3">
                  {t("book.readNowTitle", "Read the book now")}
                </h3>
                <p className="text-[#57493f] mb-5">
                  {t("book.readNowDesc", "อ่านฉบับเต็มได้เลยด้านล่างนี้")}
                </p>
                <Link
                  to={`/read/${id}`}
                  className="px-6 py-2.5 rounded-xl bg-[#d8653b] text-white shadow hover:opacity-95"
                >
                  {t("actions.openReader", "Open Reader")}
                </Link>
              </div>
            </section>

            <Footer />
            <BackToTop />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
