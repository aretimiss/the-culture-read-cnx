// src/pages/ReaderPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import InlinePdfSpread from "../components/InlinePdfSpread";
import { api, fetchJsonWithProxies, titleOf } from "../lib/omekaClient";

export default function ReaderPage() {
  const { id } = useParams();
  const [pdfUrl, setPdfUrl] = useState("");
  const [title, setTitle] = useState("กำลังโหลด…");
  const [err, setErr] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // ตรวจจับมือถือ (UA + viewport)
  useEffect(() => {
    const uaIsMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(uaIsMobile || mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // แปลง URL ให้เป็น https (กันปัญหาเบราว์เซอร์บล็อก http บนเว็บ https)
  const normalizePdfUrl = (raw) => {
    if (!raw) return "";
    return raw.startsWith("http://") ? raw.replace(/^http:/, "https:") : raw;
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr("");
        // 1) ดึง Item
        const item = await fetchJsonWithProxies(api(`/items/${id}`));
        if (!alive) return;
        const t = titleOf(item) || item?.["o:title"] || `รายการ #${id}`;
        setTitle(t);
        document.title = `${t} · อ่านหนังสือ`;

        // 2) เอา media ตัวแรกเป็น PDF
        const media = item?.["o:media"];
        if (!Array.isArray(media) || media.length === 0) {
          setErr("ไม่พบไฟล์ของรายการนี้");
          return;
        }
        const firstMediaId = media[0]["o:id"];
        const m = await fetchJsonWithProxies(api(`/media/${firstMediaId}`));
        const raw = m?.["o:original_url"];
        if (!raw) {
          setErr("ไม่พบลิงก์ไฟล์ PDF");
          return;
        }
        setPdfUrl(normalizePdfUrl(raw));
      } catch (e) {
        setErr(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      }
    })();
    return () => { alive = false; };
  }, [id]);

  // URL สำหรับมือถือ (เรนเดอร์ผ่าน Google Docs Viewer)
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
        backgroundAttachment: "fixed",
      }}
    >
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-24 pb-10">
        <nav className="text-sm text-[#7b6c61] mb-3">
          <Link to="/" className="hover:underline">หน้าแรก</Link>
          <span className="mx-2">/</span>
          <span className="text-[#5b4a3e]">{title}</span>
        </nav>

        <div className="rounded-3xl shadow-lg border border-[#e7d8c9]/70 bg-[#fffaf3]/80 backdrop-blur-md p-3 md:p-4">
          {err ? (
            <div className="p-6 text-red-700">{err}</div>
          ) : !pdfUrl ? (
            <div className="p-6 text-[#7b6c61]">กำลังเตรียมไฟล์ PDF…</div>
          ) : isMobile ? (
            // ✅ มือถือ: แสดงในหน้าเดิมผ่าน Google Docs Viewer (ไม่ต้องเปิดแท็บใหม่)
            <iframe
              title="PDF Mobile Viewer"
              src={gview}
              className="w-full rounded-2xl"
              style={{
                border: "none",
                // เผื่อพื้นที่ header; ปรับได้ตามดีไซน์จริง
                height: "calc(100dvh - 160px)",
              }}
              allow="clipboard-read; clipboard-write"
            />
          ) : (
            // ✅ เดสก์ท็อป: ใช้ react-pdf ตามเดิม
            <InlinePdfSpread
              fileUrl={`${pdfUrl}#view=FitH`}
              mobileEdge
              className="mb-0"
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
