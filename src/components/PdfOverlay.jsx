// src/components/PdfOverlay.jsx
import React, { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// ✅ worker แบบ local (คู่กับ react-pdf v10 + pdfjs-dist v5)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

/** ====== ENV & URL helpers ====== */
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

/** ====== ตัวแปลง URL → proxy raw (สำหรับไฟล์ไบนารี) ====== */
const toAllOriginsRaw = (url) =>
  `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
const toCodetabsRaw = (url) =>
  `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;

/**
 * PdfOverlay
 * props:
 *  - id: media id (แนะนำ) หรือ item id
 *  - onClose: ฟังก์ชันปิด overlay
 */
export default function PdfOverlay({ id, onClose }) {
  const [pdfUrl, setPdfUrl] = useState("");
  const [currentUrl, setCurrentUrl] = useState(""); // ใช้เปลี่ยนไป proxy เมื่อ error
  const [numPages, setNumPages] = useState(null);
  const [width, setWidth] = useState(window.innerWidth);
  const [loading, setLoading] = useState(true);
  const [viewerMode, setViewerMode] = useState("pdfjs"); // 'pdfjs' | 'iframe'
  const [triedProxy, setTriedProxy] = useState(0); // 0=ตรง,1=allorigins,2=codetabs
  const scrollBoxRef = useRef(null);

  // ล็อกสกรอลล์หน้าหลัก
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const getPdfUrlFromMediaId = async (mediaId) => {
    const media = await fetchJsonWithProxies(api(`/media/${mediaId}`));
    const url = media?.["o:original_url"] || "";
    if (!url) throw new Error("media ไม่มี o:original_url");
    return url;
  };
  const getPdfUrlFromItemId = async (itemId) => {
    const item = await fetchJsonWithProxies(api(`/items/${itemId}`));
    const medias = item?.["o:media"] || [];
    for (const m of medias) {
      const mid = m?.["o:id"];
      if (!mid) continue;
      const media = await fetchJsonWithProxies(api(`/media/${mid}`));
      const url = media?.["o:original_url"] || "";
      if (url.toLowerCase().endsWith(".pdf")) return url;
    }
    throw new Error("ไม่พบไฟล์ PDF ใน item นี้");
  };

  // โหลด URL หลักครั้งแรก
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setViewerMode("pdfjs");
        setTriedProxy(0);

        let url = "";
        try {
          url = await getPdfUrlFromMediaId(id);
        } catch {
          url = await getPdfUrlFromItemId(id);
        }

        setPdfUrl(url);
        setCurrentUrl(url); // เริ่มจาก URL ตรง
      } catch (e) {
        console.error(e);
        alert("ไม่สามารถโหลดไฟล์ PDF ได้");
        onClose?.();
      } finally {
        setLoading(false);
      }
    })();
  }, [id, onClose]);

  const handlePdfError = () => {
    // ลอง proxy แบบ raw ทีละตัว แล้วค่อย fallback เป็น iframe
    if (triedProxy === 0) {
      setCurrentUrl(toAllOriginsRaw(pdfUrl));
      setTriedProxy(1);
    } else if (triedProxy === 1) {
      setCurrentUrl(toCodetabsRaw(pdfUrl));
      setTriedProxy(2);
    } else {
      // ใช้ iframe เป็นแผน C
      setViewerMode("iframe");
    }
  };

  const isWide = width > 1024;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center">
      <div className="w-[98vw] h-[94vh] max-w-[1400px] bg-[#fbf6ed] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#eadfd2] bg-[#fffdf6]">
          <div className="font-semibold text-[#5b4a3e]">อ่านเอกสาร</div>
          <div className="flex items-center gap-2">
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-md border border-[#e8dccc] text-[#5b4a3e] hover:bg-[#fff7ef]"
              >
                เปิดในแท็บใหม่
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-md bg-[#d8653b] text-white hover:bg-[#c85a32]"
            >
              ปิด
            </button>
          </div>
        </div>

        {/* Body */}
        <div ref={scrollBoxRef} className="flex-1 overflow-auto px-2 sm:px-4 py-4">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#d8653b]" />
              <p className="mt-3 text-[#a36a46]">กำลังโหลดหนังสือ...</p>
            </div>
          ) : viewerMode === "iframe" ? (
            // ✅ Fallback: iframe (ถ้าเซิร์ฟเวอร์ไม่บล็อก X-Frame-Options)
            <iframe
              title="pdf"
              src={currentUrl}
              className="w-full h-[80vh] rounded-lg bg-white"
            />
          ) : (
            // ✅ ปกติ: ใช้ pdf.js ผ่าน react-pdf
            <div className="flex flex-col items-center">
              <Document
                file={{ url: currentUrl }}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                onLoadError={handlePdfError}          // 🔥 ถ้า error → ลอง proxy / iframe
                loading="กำลังโหลดเอกสาร..."
                className="bg-[#fffdf6]"
              >
                {Array.from(new Array(numPages), (_, i) =>
                  isWide ? (
                    i % 2 === 0 && (
                      <div key={i} className="flex justify-center mb-4 gap-4">
                        <Page pageNumber={i + 1} width={Math.min(620, width / 2.2)} renderAnnotationLayer={false} renderTextLayer />
                        {i + 2 <= numPages && (
                          <Page pageNumber={i + 2} width={Math.min(620, width / 2.2)} renderAnnotationLayer={false} renderTextLayer />
                        )}
                      </div>
                    )
                  ) : (
                    <div key={i} className="flex justify-center mb-4">
                      <Page pageNumber={i + 1} width={Math.min(820, width - 32)} renderAnnotationLayer={false} renderTextLayer />
                    </div>
                  )
                )}
              </Document>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
