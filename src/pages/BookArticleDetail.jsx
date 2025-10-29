// src/pages/BookShowcaseDelassusStyle.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import BackToTop from "../components/BackToTop";
import { api, fetchJsonWithProxies, titleOf } from "../lib/omekaClient";

/** Utility helpers */
const getVal = (item, key, fallback = "-") => item?.[key]?.[0]?.["@value"] ?? fallback;
const normalizeHttps = (raw) => (raw ? (raw.startsWith("http://") ? raw.replace(/^http:/, "https:") : raw) : "");

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
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
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

export default function BookShowcaseDelassusStyle() {
  const { id } = useParams(); // optional: /showcase/:id
  const [item, setItem] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let keep = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchJsonWithProxies(api(`/items/${id}`));
        if (!keep) return;
        setItem(data);
        document.title = `${titleOf(data) || data?.["o:title"] || "Book"} · Showcase`;
      } catch (e) {
        if (keep) setErr(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally { if (keep) setLoading(false); }
    })();
    return () => { keep = false; };
  }, [id]);

  // Map metadata → UI fields
  const meta = useMemo(() => {
    if (!item) return {};
    const cover =
      item?.thumbnail_display_urls?.large || item?.thumbnail_display_urls?.medium || "/assets/placeholder.webp";
    const lang = getVal(item, "dcterms:language", "und");
    const publisher = getVal(item, "dcterms:publisher", "-");
    const date = getVal(item, "dcterms:date", "-");
    const creator = getVal(item, "dcterms:creator", "-");
    const type = getVal(item, "dcterms:type", "Book");
    const extent = getVal(item, "dcterms:extent", "");
    const rights = getVal(item, "dcterms:rights", "");
    const descList = Array.isArray(item?.["dcterms:description"]) ? item["dcterms:description"].map((d)=>d?.["@value"]) : [];
    return { cover, lang, publisher, date, creator, type, extent, rights, title: titleOf(item) || item?.["o:title"], descList };
  }, [item]);

  const sections = [
    { id: "ov", label: "Overview" },
    { id: "facts", label: "Key Facts" },
    { id: "author", label: "Author" },
    { id: "excerpt", label: "Excerpts" },
    { id: "gallery", label: "Gallery" },
    { id: "cta", label: "Read" },
  ];

  // Page shell
  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#1b1b1b]">
      <SiteHeader />
      <SectionDots sections={sections} />

      {/* HERO */}
      <header id="ov" className="pt-28 md:pt-32 pb-8">
        <div className="max-w-7xl mx-auto px-5 md:px-8 grid md:grid-cols-2 gap-6 md:gap-10 items-center">
          <ParallaxImage src={normalizeHttps(meta.cover)} alt={meta.title || "cover"} className="aspect-[3/4]" />
          <div className="">
            <p className="text-sm tracking-widest uppercase text-[#a5866e] mb-3">Featured Book</p>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-[#5b4a3e]">{meta.title || "Your Book Title"}</h1>
            <p className="mt-4 text-[15px] leading-7 text-[#5b4a3e] opacity-90 max-w-prose">
              {meta.descList?.[0] || "A striking showcase section with clean typography and generous white space, inspired by Delassus."}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[meta.type || "Book", meta.lang || "und", meta.date || "-"].map((t) => (
                <span key={t} className="px-3 py-1 rounded-full bg-[#fffaf3] ring-1 ring-[#eadfce] text-sm text-[#5b4a3e]">{t}</span>
              ))}
            </div>
            <div className="mt-8 flex gap-3 flex-wrap">
              <Link to={id ? `/read/${id}` : "#"} className="px-5 py-2.5 rounded-xl bg-[#d8653b] text-white shadow hover:opacity-95">Read now</Link>
              <Link to={id ? `/articles/${id}` : "#"} className="px-5 py-2.5 rounded-xl bg-white ring-1 ring-[#eadfce] text-[#5b4a3e] hover:bg-[#fff7ee]">Long article</Link>
            </div>
          </div>
        </div>
      </header>

      {/* KEY FACTS */}
      <section id="facts" className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-5 md:px-8 grid md:grid-cols-12 gap-6">
          <div className="md:col-span-5">
            <div className="rounded-3xl bg-[#fffaf3] ring-1 ring-[#eadfce] p-6 md:p-8 shadow-sm">
              <h2 className="text-2xl md:text-3xl font-bold text-[#5b4a3e] mb-4">Key facts</h2>
              <dl className="grid grid-cols-2 gap-4 text-sm text-[#57493f]">
                <div><dt className="opacity-60">Author</dt><dd className="font-medium">{meta.creator}</dd></div>
                <div><dt className="opacity-60">Published</dt><dd className="font-medium">{meta.date}</dd></div>
                <div><dt className="opacity-60">Publisher</dt><dd className="font-medium">{meta.publisher}</dd></div>
                <div><dt className="opacity-60">Language</dt><dd className="font-medium">{meta.lang}</dd></div>
                {meta.extent && <div><dt className="opacity-60">Extent</dt><dd className="font-medium">{meta.extent}</dd></div>}
                {meta.rights && <div className="col-span-2"><dt className="opacity-60">Rights</dt><dd className="font-medium">{meta.rights}</dd></div>}
              </dl>
            </div>
          </div>
          <div className="md:col-span-7">
            <ParallaxImage src={normalizeHttps(meta.cover)} alt="cover large" className="aspect-[21/9]" />
          </div>
        </div>
      </section>

      {/* AUTHOR */}
      <section id="author" className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-5 md:px-8 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#5b4a3e] mb-4">About the author</h2>
            <p className="text-[#57493f] leading-8">
              {meta.creator && meta.creator !== "-" ? `${meta.creator} —` : "The author —"} This section mirrors Delassus-style editorial blocks: big headings, calm colors, and soft card edges. Replace with the author's biography or context of the work.
            </p>
          </div>
          <ParallaxImage src={normalizeHttps(meta.cover)} alt="author related" className="aspect-video" />
        </div>
      </section>

      {/* EXCERPTS */}
      <section id="excerpt" className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="rounded-3xl ring-1 ring-[#eadfce] bg-white p-6 md:p-10 shadow-sm">
            <h2 className="text-2xl md:text-3xl font-bold text-[#5b4a3e] mb-6">Highlighted excerpts</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {(meta.descList?.slice(0,3)?.length ? meta.descList.slice(0,3) : [
                "An opening that sets the tone for discovery and cultural memory.",
                "A paragraph that reveals the texture of place and people.",
                "A passage whose cadence lingers beyond the page."
              ]).map((t, i) => (
                <blockquote key={i} className="rounded-2xl bg-[#fffaf3] ring-1 ring-[#eadfce] p-5 text-[#3f342d] leading-7">
                  <span className="text-[#d8653b] mr-2">“</span>{t}<span className="text-[#d8653b] ml-1">”</span>
                </blockquote>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#5b4a3e] mb-6">Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ParallaxImage key={i} src={normalizeHttps(meta.cover)} alt={`page-${i+1}`} className="aspect-[3/4]" />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="py-16">
        <div className="max-w-5xl mx-auto px-5 md:px-8 text-center">
          <div className="rounded-3xl bg-[#fffaf3] ring-1 ring-[#eadfce] p-10 shadow">
            <h3 className="text-2xl md:text-3xl font-bold text-[#5b4a3e]">Read the book now</h3>
            <p className="text-[#57493f] mt-2">Open the reader or view the long-form article with annotations.</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link to={id ? `/read/${id}` : "#"} className="px-5 py-2.5 rounded-xl bg-[#d8653b] text-white shadow hover:opacity-95">Open Reader</Link>
              <Link to={id ? `/articles/${id}` : "#"} className="px-5 py-2.5 rounded-xl bg-white ring-1 ring-[#eadfce] text-[#5b4a3e] hover:bg-[#fff7ee]">Article</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <BackToTop />
    </div>
  );
}
