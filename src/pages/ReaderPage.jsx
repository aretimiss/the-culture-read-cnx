// src/pages/ReaderPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import InlinePdfSpread from "../components/InlinePdfSpread"; // ⬅️ ใช้คอมโพเนนต์ที่ต้องการ
import { api, fetchJsonWithProxies, titleOf } from "../lib/omekaClient";

export default function ReaderPage() {
  const { id } = useParams();
  const [pdfUrl, setPdfUrl] = useState("");
  const [title, setTitle] = useState("กำลังโหลด…");
  const [err,   setErr]   = useState("");

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

        // 2) ดึง media ตัวแรกเพื่อหา PDF
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
        setPdfUrl(raw); // ใช้ URL ตรงได้เลย
      } catch (e) {
        setErr(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      }
    })();
    return () => { alive = false; };
  }, [id]);

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
          ) : (
            <InlinePdfSpread
              fileUrl={`${pdfUrl}#view=FitH`} // ⬅️ ถ้าต้องการซ่อนหัว viewer
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
