// src/pages/ReaderPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import InlinePdfSpread from "../components/InlinePdfSpread";

import { api, fetchJsonWithProxies } from "../lib/omekaClient";
import { pickLang } from "../lib/i18nPick";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

export default function ReaderPage() {
  const { t } = useTranslation();
  const { id } = useParams();

  const [pdfUrl, setPdfUrl] = useState("");
  const [title, setTitle] = useState(t("status.loading", "กำลังโหลด…"));
  const [err, setErr] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // ปรับ background-attachment สำหรับ iOS/mobile + ตรวจจับจอเล็ก
  useEffect(() => {
    const uaIsMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(uaIsMobile || mq.matches);

    // iOS safari ไม่ชอบ fixed
    document.documentElement.style.setProperty("--bg-attach", mq.matches ? "scroll" : "fixed");

    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const normalizePdfUrl = (raw) => {
    if (!raw) return "";
    return raw.startsWith("http://") ? raw.replace(/^http:/, "https:") : raw;
  };

  // ดึงข้อมูลรายการ + หา media ที่เป็น PDF
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setErr("");
        setPdfUrl("");
        setTitle(t("status.loading", "กำลังโหลด…"));

        // 1) ดึง Item
        const item = await fetchJsonWithProxies(api(`/items/${id}`));
        if (!alive) return;

        const ti =
          pickLang(item?.["dcterms:title"], i18n.language) ||
          item?.["o:title"] ||
          `${t("reader.item", "รายการ")} #${id}`;

        setTitle(ti);
        document.title = `${ti} · ${t("reader.reading", "อ่านหนังสือ")}`;

        // 2) เลือก media ที่เป็น PDF
        const medias = Array.isArray(item?.["o:media"]) ? item["o:media"] : [];
        if (!medias.length) {
          setErr(t("reader.noFiles", "ไม่พบไฟล์ของรายการนี้"));
          return;
        }

        // ไล่เช็คทีละ media จนกว่าจะเจอ PDF
        let found = "";
        for (const m of medias) {
          const mid = m?.["o:id"];
          if (!mid) continue;
          const md = await fetchJsonWithProxies(api(`/media/${mid}`));
          const url = md?.["o:original_url"] || "";
          const type = (md?.["o:media_type"] || "").toLowerCase();
          const looksPdf = type.includes("pdf") || /\.pdf(\?|$)/i.test(url);
          if (looksPdf && url) {
            found = normalizePdfUrl(url);
            break;
          }
        }

        // ถ้ายังไม่เจอ PDF เลย ลอง fallback เป็น media แรก
        if (!found) {
          const md0 = await fetchJsonWithProxies(api(`/media/${medias[0]["o:id"]}`));
          const url0 = md0?.["o:original_url"];
          if (url0) found = normalizePdfUrl(url0);
        }

        if (!found) {
          setErr(t("reader.noPdf", "ไม่พบลิงก์ไฟล์ PDF"));
          return;
        }

        setPdfUrl(found);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || t("errors.loadFailed", "โหลดข้อมูลไม่สำเร็จ"));
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, i18n.language, t]);

  const gview = pdfUrl
    ? `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`
    : "";

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

      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-24 pb-10">
        <nav className="text-sm text-[#7b6c61] mb-3">
          <Link to="/" className="hover:underline">
            {t("nav.home", "หน้าแรก")}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#5b4a3e]">{title}</span>
        </nav>

        <div className="rounded-3xl shadow-lg border border-[#e7d8c9]/70 bg-[#fffaf3]/80 backdrop-blur-md p-3 md:p-4">
          {err ? (
            <div className="p-6 text-red-700">{err}</div>
          ) : !pdfUrl ? (
            <div className="p-6 text-[#7b6c61]">{t("reader.preparing", "กำลังเตรียมไฟล์ PDF…")}</div>
          ) : isMobile ? (
            // ✅ มือถือ: Google Docs Viewer ภายในหน้า (ไม่ต้องเปิดแท็บใหม่)
            <iframe
              title="PDF Mobile Viewer"
              src={gview}
              className="w-full rounded-2xl"
              style={{ border: "none", height: "calc(100dvh - 160px)" }}
              allow="clipboard-read; clipboard-write"
            />
          ) : (
            // ✅ เดสก์ท็อป: ใช้ react-pdf แบบกระดาษคู่/ปรับขนาด
            <InlinePdfSpread fileUrl={`${pdfUrl}#view=FitH`} mobileEdge className="mb-0" />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
