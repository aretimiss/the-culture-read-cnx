import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import BackToTop from "../components/BackToTop";
import InlinePdfSpread from "../components/InlinePdfSpread";
import {
  api,
  fetchJsonWithProxies,
  titleOf,
  descOf,
} from "../lib/omekaClient";

/** helper */
const getVal = (item, key) => item?.[key]?.[0]?.["@value"] || "-";

export default function BookArticleDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchJsonWithProxies(api(`/items/${id}`));
        if (!alive) return;
        setItem(data);

        const t = titleOf(data) || data?.["o:title"] || "บทความ";
        document.title = `${t} · บทความแนะนำหนังสือ`;

        // ดึงไฟล์ PDF ของ Item นี้
       const media = data?.["o:media"];
        if (Array.isArray(media) && media.length > 0) {
          const firstMediaId = media[0]["o:id"];
          const mediaData = await fetchJsonWithProxies(api(`/media/${firstMediaId}`));
          const rawUrl = mediaData?.["o:original_url"];
          if (rawUrl) {
            setPdfUrl(rawUrl);            // << ใช้ URL ตรงได้แล้ว
            // ถ้ายังอยากใช้ proxy ของ Netlify ก็เปลี่ยนเป็น:
            // setPdfUrl(`/api/pdf?src=${encodeURIComponent(rawUrl)}`);
          }
        }

      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const meta = useMemo(() => {
    if (!item) return {};
    return {
      title: titleOf(item) || item?.["o:title"],
      description: descOf(item),
      creator: getVal(item, "dcterms:creator"),
      date: getVal(item, "dcterms:date"),
      extent: getVal(item, "dcterms:extent"),
      identifier: getVal(item, "dcterms:identifier"),
      type: getVal(item, "dcterms:type"),
      thumb: item?.thumbnail_display_urls?.large || "/assets/placeholder.webp",
    };
  }, [item]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf7f2]">
        <SiteHeader />
        <div className="max-w-7xl mx-auto px-6 py-24 animate-pulse">
          <div className="h-10 w-1/2 bg-[#e7d8c9] rounded mb-6" />
          <div className="h-96 bg-[#efe4d9] rounded" />
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
          <Link to="/articles" className="mt-6 inline-block text-[#d8653b] underline">
            ย้อนกลับไปหน้ารวมบทความ
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

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

      {/* HERO */}
      <section className="pt-28 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <nav className="text-sm text-[#7b6c61] mb-3">
            <Link to="/" className="hover:underline">หน้าแรก</Link>
            <span className="mx-2">/</span>
            <Link to="/articles" className="hover:underline">บทความแนะนำหนังสือ</Link>
            <span className="mx-2">/</span>
            <span className="text-[#5b4a3e]">{meta.title}</span>
          </nav>

          <div className="rounded-3xl shadow-lg border border-[#e7d8c9]/70 bg-[#fffaf3]/80 backdrop-blur-md p-5 md:p-6">
            {/* ขยายพื้นที่ตัวอ่าน: 5/6 สำหรับ PDF, 1/6 สำหรับหัวเรื่อง/เมทาดาทา */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
              {/* พื้นที่แสดง PDF */}
              <div className="md:col-span-5">
                {pdfUrl ? (
                  <InlinePdfSpread fileUrl={pdfUrl} mobileEdge className="mb-8" />
                ) : (
                  <img
                    src={meta.thumb}
                    alt={meta.title}
                    className="w-full aspect-[3/4] object-cover rounded-2xl ring-1 ring-[#e7d8c9]"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BODY: รวมเนื้อหาไว้จุดเดียว */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pb-20">
        <article className="bg-white/95 border border-[#e7d8c9] rounded-3xl shadow-md p-6 md:p-10 leading-8 text-[#3f342d]">
          
          {/* หัวเรื่อง */}
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#5b4a3e] mb-4">
            {meta.title}
          </h1>

          {/* ข้อมูลเมตา */}
          <ul className="mb-6 space-y-1 text-[15px] text-[#57493f]">
            <li><span className="opacity-70">ผู้แต่ง:</span> {meta.creator}</li>
            <li><span className="opacity-70">ปี/วันที่:</span> {meta.date}</li>
            <li><span className="opacity-70">จำนวนหน้า:</span> {meta.extent}</li>
            <li><span className="opacity-70">เลขทะเบียน:</span> {meta.identifier}</li>
            <li><span className="opacity-70">ประเภท:</span> {meta.type}</li>
          </ul>

          {/* เนื้อหา/คำอธิบาย */}
          {meta.description ? (
            <p
              className="[&::first-letter]:float-left [&::first-letter]:text-5xl
                          [&::first-letter]:leading-[0.9] [&::first-letter]:pr-2
                          [&::first-letter]:font-semibold
                          [&::first-letter]:text-[#5b4a3e] whitespace-pre-wrap"
            >
              {meta.description}
            </p>
          ) : (
            <p className="italic text-[#7b6c61]">
              ยังไม่มีคำอธิบายสำหรับรายการนี้
            </p>
          )}
        </article>
      </main>


      <Footer />
      <BackToTop />
    </div>
  );
}
