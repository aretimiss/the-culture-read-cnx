import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";

// ✅ ใช้ worker จาก CDN (เหมาะกับ CRA)
// ...imports เดิม (react, react-pdf, SiteHeader, Footer)
// กำหนด worker เหมือนเดิม
pdfjs.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/** helpers */
const RAW_BASE = process.env.REACT_APP_API_BASE_URL || "";
const BASE_URL = RAW_BASE.replace(/\/+$/, "");
const withKeys = (url) => {
  const key_identity = process.env.REACT_APP_API_KEY_IDENTITY;
  const key_credential = process.env.REACT_APP_API_KEY_CREDENTIAL;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}key_identity=${key_identity}&key_credential=${key_credential}`;
};
const api = (path) =>
  withKeys(`${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);

async function fetchJsonWithProxies(finalUrl) {
  try {
    const r1 = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(finalUrl)}`);
    if (r1.ok) return JSON.parse((await r1.json()).contents);
  } catch {}
  try {
    const r2 = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(finalUrl)}`);
    if (r2.ok) return await r2.json();
  } catch {}
  const r3 = await fetch(finalUrl);
  if (!r3.ok) throw new Error("fetch failed");
  return await r3.json();
}

/** ✅ เอา URL PDF จาก o:original_url เท่านั้น */
async function getPdfUrlFromMediaId(mediaId) {
  const media = await fetchJsonWithProxies(api(`/media/${mediaId}`));
  const url = media?.["o:original_url"];
  if (!url) throw new Error("media ไม่มี o:original_url");
  return url;
}

async function getPdfUrlFromItemId(itemId) {
  const item = await fetchJsonWithProxies(api(`/items/${itemId}`));
  const medias = item?.["o:media"] || [];
  for (const m of medias) {
    const mid = m?.["o:id"];
    if (!mid) continue;
    const media = await fetchJsonWithProxies(api(`/media/${mid}`));
    const url = media?.["o:original_url"] || "";
    if (url.toLowerCase().endsWith(".pdf")) return url;   // ✅ เช็คลงท้าย .pdf
  }
  throw new Error("ไม่พบไฟล์ PDF ใน item นี้");
}

export default function PdfReaderPage() {
  const { id } = useParams(); // อาจเป็น media id หรือ item id
  const navigate = useNavigate();
  const [pdfUrl, setPdfUrl] = useState("");
  const [numPages, setNumPages] = useState(null);
  const [width, setWidth] = useState(window.innerWidth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // 1) ลองเป็น media id ก่อน
        let url = "";
        try {
          url = await getPdfUrlFromMediaId(id);
        } catch {
          // 2) ถ้าไม่ใช่/ไม่ได้ → ลองเป็น item id
          url = await getPdfUrlFromItemId(id);
        }

        setPdfUrl(url);
      } catch (e) {
        console.error(e);
        alert("ไม่สามารถโหลดไฟล์ PDF ได้");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isWide = width > 1024;

  return (
    <div className="min-h-screen bg-[#fbf6ed] text-[#5b4a3e]">
      <SiteHeader />
      <div className="h-[88px]" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => navigate("/books")}
            className="px-4 py-2 bg-[#d8653b] text-white rounded hover:bg-[#c85a32]"
          >
            ← กลับไปหน้ารวมหนังสือ
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#d8653b]" />
            <p className="mt-3 text-[#a36a46]">กำลังโหลดหนังสือ...</p>
          </div>
        ) : !pdfUrl ? (
          <p className="text-center text-red-600 mt-10">ไม่พบไฟล์ PDF</p>
        ) : (
          <div className="flex flex-col items-center">
            <Document
              file={pdfUrl}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading="กำลังโหลดเอกสาร..."
              className="shadow-md bg-[#fffdf6] rounded-lg"
            >
              {Array.from(new Array(numPages), (_, i) =>
                isWide ? (
                  i % 2 === 0 && (
                    <div key={i} className="flex justify-center mb-4 gap-4">
                      <Page pageNumber={i + 1} width={width / 2.5} renderAnnotationLayer={false} renderTextLayer />
                      {i + 2 <= numPages && (
                        <Page pageNumber={i + 2} width={width / 2.5} renderAnnotationLayer={false} renderTextLayer />
                      )}
                    </div>
                  )
                ) : (
                  <div key={i} className="flex justify-center mb-4">
                    <Page pageNumber={i + 1} width={width - 40} renderAnnotationLayer={false} renderTextLayer />
                  </div>
                )
              )}
            </Document>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

