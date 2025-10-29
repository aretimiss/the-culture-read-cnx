// src/pages/ParallaxBookDetail.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import BackToTop from "../components/BackToTop";
import { api, fetchJsonWithProxies, titleOf } from "../lib/omekaClient";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

/** helpers */
const getList = (item, key) => (Array.isArray(item?.[key]) ? item[key] : []);
const getVal = (item, key, fallback = "-") =>
  item?.[key]?.[0]?.["@value"] ?? fallback;
const normalizeHttps = (raw) =>
  raw ? (raw.startsWith("http://") ? raw.replace(/^http:/, "https:") : raw) : "";

// ตรวจจับมือถือ (UA + viewport)
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const uaIsMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(uaIsMobile || mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
};

export default function ParallaxBookDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [shiftRight, setShiftRight] = useState(false); // เมื่อเลื่อนลง ให้ปกย้ายไปฝั่งขวา
  const isMobile = useIsMobile();

  // สำหรับวัดความสูงของกล่องรายละเอียด -> ทำให้ความสูงของปกเท่ากัน (desktop)
  const sentinelRef = useRef(null);
  const detailRef = useRef(null);
  const [heroDetailH, setHeroDetailH] = useState(null);

  // โหลดข้อมูล
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await fetchJsonWithProxies(api(`/items/${id}`));
        if (!alive) return;
        setItem(data);
        const t = titleOf(data) || data?.["o:title"] || "รายละเอียดหนังสือ";
        document.title = `${t} · Parallax Detail`;
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // Toggle shiftRight เมื่อหน้าจอเลื่อนผ่านจุดเริ่มต้นของเนื้อหา descriptions
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        // descriptions เริ่มเข้าจอ -> ปกย้ายฝั่ง
        setShiftRight(e.isIntersecting);
      },
      { root: null, threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // วัดความสูงกล่องรายละเอียด เพื่อเซ็ตความสูงปกให้เท่ากัน (เฉพาะ desktop)
  useEffect(() => {
    const target = detailRef.current;
    if (!target) return;

    const measure = () => setHeroDetailH(target.offsetHeight);
    measure();

    // รองรับเปลี่ยนขนาด/รีเฟรชเนื้อหา
    const ro = new ResizeObserver(measure);
    ro.observe(target);
    window.addEventListener("resize", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [detailRef, item]);

  const meta = useMemo(() => {
    if (!item) return {};
    return {
      title: titleOf(item) || item?.["o:title"],
      creator: getVal(item, "dcterms:creator"),
      date: getVal(item, "dcterms:date"),
      extent: getVal(item, "dcterms:extent", ""),
      identifier: getVal(item, "dcterms:identifier", ""),
      type: getVal(item, "dcterms:type", ""),
      format: getVal(item, "dcterms:format", ""),
      publisher: getVal(item, "dcterms:publisher", ""),
      language: getVal(item, "dcterms:language", ""),
      rights: getVal(item, "dcterms:rights", ""),
      thumb:
        item?.thumbnail_display_urls?.large ||
        item?.thumbnail_display_urls?.medium ||
        "/assets/placeholder.webp",
    };
  }, [item]);

  const descriptions = useMemo(() => {
    const arr = Array.isArray(item?.["dcterms:description"])
      ? item["dcterms:description"]
      : [];
    return arr
      .map((d) => (typeof d?.["@value"] === "string" ? d["@value"].trim() : ""))
      .filter(Boolean);
  }, [item]);

  const primaryPdfUrl = useMemo(() => {
    const mediaArr = Array.isArray(item?.["o:media"]) ? item["o:media"] : [];
    if (mediaArr.length === 0) return "";
    const firstId = mediaArr[0]?.["o:id"];
    return firstId ? `/read/${id}` : "";
  }, [item, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf7f2]">
        <SiteHeader />
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="h-8 w-40 bg-[#e7d8c9] rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-[60vh] bg-[#efe4d9] rounded-3xl animate-pulse" />
            <div className="space-y-3">
              <div className="h-7 w-3/4 bg-[#efe4d9] rounded animate-pulse" />
              <div className="h-7 w-2/3 bg-[#efe4d9] rounded animate-pulse" />
              <div className="h-40 w-full bg-[#efe4d9] rounded animate-pulse" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (err || !item) {
    return (
      <div className="min-h-screen bg-[#faf7f2]">
        <SiteHeader />
        <main className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-red-700 mb-2">เกิดข้อผิดพลาด</h1>
          <p className="text-[#7b6c61]">{err || "ไม่พบข้อมูล"}</p>
          <Link to="/" className="mt-6 inline-block text-[#d8653b] underline">
            กลับหน้าแรก
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // สลับฝั่ง (sticky cover) เมื่อเลื่อนถึง descriptions
  const coverColClass = shiftRight ? "md:col-start-2" : "md:col-start-1";
  const detailColClass = shiftRight ? "md:col-start-1" : "md:col-start-2";

  return (
    <div className="min-h-screen text-[#111518] bg-[#faf7f2]">
      <SiteHeader />

      {/* HERO + ปกตรึง (sticky) */}
      <section className="pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {/* breadcrumb */}
          <nav className="text-sm text-[#7b6c61] mb-4">
            <Link to="/" className="hover:underline">
              หน้าแรก
            </Link>
            <span className="mx-2">/</span>
            <Link to="/books" className="hover:underline">
              แนะนำหนังสือ
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[#5b4a3e]">{meta.title}</span>
          </nav>

          {/* กริด 2 คอลัมน์: ปก (sticky) + รายละเอียด (ไม่แสดง description) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* ปก: sticky และย้ายคอลัมน์เมื่อ shiftRight = true */}
            <div className={`${coverColClass}`}>
              <div
                className="md:sticky md:top-24"
                style={{ height: isMobile ? undefined : heroDetailH || undefined }}
              >
                <ParallaxCover
                  src={normalizeHttps(meta.thumb)}
                  alt={meta.title}
                  shiftRight={shiftRight}
                />
              </div>
            </div>

            {/* รายละเอียด: ไม่แสดง description ที่นี่ */}
            <div className={`${detailColClass}`} ref={detailRef}>
              <div className="rounded-3xl shadow-lg border border-[#e7d8c9]/70 bg-[#fffaf3]/90 backdrop-blur p-6 md:p-8">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#5b4a3e] mb-3">
                  {meta.title}
                </h1>
                <ul className="space-y-1 text-[15px] text-[#57493f]">
                  <li>
                    <span className="opacity-70">ผู้แต่ง:</span> {meta.creator}
                  </li>
                  <li>
                    <span className="opacity-70">ปี/วันที่:</span> {meta.date}
                  </li>
                  {meta.extent && (
                    <li>
                      <span className="opacity-70">จำนวนหน้า:</span> {meta.extent}
                    </li>
                  )}
                  {meta.identifier && (
                    <li>
                      <span className="opacity-70">เลขทะเบียน/ลิงก์:</span> {meta.identifier}
                    </li>
                  )}
                  {meta.type && (
                    <li>
                      <span className="opacity-70">ประเภท:</span> {meta.type}
                    </li>
                  )}
                  {meta.format && (
                    <li>
                      <span className="opacity-70">ฟอร์แมต:</span> {meta.format}
                    </li>
                  )}
                  {meta.publisher && (
                    <li>
                      <span className="opacity-70">สำนักพิมพ์:</span> {meta.publisher}
                    </li>
                  )}
                  {meta.language && (
                    <li>
                      <span className="opacity-70">ภาษา:</span> {meta.language}
                    </li>
                  )}
                  {meta.rights && (
                    <li>
                      <span className="opacity-70">สิทธิ์:</span> {meta.rights}
                    </li>
                  )}
                </ul>
                <div className="mt-6 flex gap-3 flex-wrap">
                  {primaryPdfUrl && (
                    <Link
                      to={primaryPdfUrl}
                      className="inline-flex items-center px-4 py-2 rounded-xl bg-[#d8653b] text-white shadow hover:opacity-95 transition"
                    >
                      Read Now
                    </Link>
                  )}
                  <Link
                    to={`/articles/${id}`}
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-white text-[#5b4a3e] ring-1 ring-[#e7d8c9] shadow-sm hover:bg-[#fff7ee]"
                  >
                    เปิดบทความแบบอ่านยาว
                  </Link>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* S E N T I N E L : จุดเริ่ม descriptions เพื่อสลับฝั่งปก */}
      <div ref={sentinelRef} className="h-4" />

      {/* DESCRIPTION SECTIONS */}
      <main className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-14">
          {descriptions.length === 0 && (
            <p className="text-center text-[#7b6c61]">
              ยังไม่มีคำอธิบายสำหรับรายการนี้
            </p>
          )}

          {descriptions.map((desc, idx) => {
            const even = idx % 2 === 0;
            // หลังปกย้ายไปขวา: บล็อกแรกอยู่ซ้าย จากนั้นสลับฟันปลา
            const textOnLeft = shiftRight ? true : !even;
            return (
              <section
                key={idx}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start"
              >
                <div className={textOnLeft ? "order-2 md:order-1" : "order-2 md:order-2"}>
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="bg-white/95 border border-[#e7d8c9] rounded-3xl shadow-md p-6 md:p-8 leading-8 text-[#3f342d]"
                  >
                    <h2 className="text-xl font-semibold text-[#5b4a3e] mb-3">
                      คำอธิบาย {descriptions.length > 1 ? `(${idx + 1})` : ""}
                    </h2>
                    <p className="whitespace-pre-wrap">{desc}</p>
                  </motion.div>
                </div>
                {/* ช่องว่างฝั่งปก (ปกอยู่ sticky ด้านบน) */}
                <div className={textOnLeft ? "order-1 md:order-2" : "order-1 md:order-1"}>
                  <div className="hidden md:block h-0" />
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}

/* ========= Parallax Cover (ภาพปกเดียว + sticky + parallax + glide เมื่อต้องย้ายฝั่ง) ========= */
function ParallaxCover({ src, alt, shiftRight }) {
  const ref = useRef(null);

  // Parallax เฉพาะบริเวณภาพปก (เมื่อสกรอลผ่าน)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // ลอยขึ้น ~40px และซูมออกเล็กน้อยขณะเลื่อน
  const y = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.02, 1.0]);

  const smoothY = useSpring(y, { stiffness: 120, damping: 20 });
  const smoothScale = useSpring(scale, { stiffness: 120, damping: 20 });

  // เมื่อต้องย้ายฝั่ง เพิ่ม motion x เล็กน้อยให้รู้สึก “glide”
  const glideX = useSpring(shiftRight ? 8 : 0, { stiffness: 120, damping: 20 });

  return (
    <motion.div
      ref={ref}
      style={{ y: smoothY, scale: smoothScale, x: glideX }}
      className="rounded-3xl overflow-hidden shadow-xl ring-1 ring-[#e7d8c9] bg-[#fffaf3]"
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </motion.div>
  );
}
