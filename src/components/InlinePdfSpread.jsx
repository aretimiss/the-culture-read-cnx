// CSS ของ react-pdf ต้องอยู่บนสุดเสมอ
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import React, { useState, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// ตั้งค่า workerSrc สำหรับ Vite + pdfjs-dist 5.x
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default function InlinePdfSpread({ fileUrl, height = 520 }) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);     // หน้าปัจจุบัน (ซ้ายเมื่อเป็นหน้าคู่)
  const [scale, setScale] = useState(1);
  const [isWide, setIsWide] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : false
  );

  // อัปเดต isWide ตามการปรับขนาดหน้าจอแบบ real-time
  useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 1024);
    onResize(); // sync ทันทีตอน mount
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // เมื่อสลับไปโหมดหน้าคู่ ให้ทำให้หน้าเริ่มต้นเป็นเลขคี่เสมอ (อยู่ซ้าย)
  useEffect(() => {
    if (isWide && page % 2 === 0) {
      setPage((p) => Math.max(1, p - 1));
    }
  }, [isWide, page]);

  const onLoadSuccess = ({ numPages }) => setNumPages(numPages);

  const showRight = isWide && page + 1 <= numPages; // แสดงหน้าขวาเฉพาะจอกว้าง

  const step = showRight ? 2 : 1;

  const next = useCallback(() => {
    setPage((p) => Math.min(p + step, numPages - (showRight ? (numPages % 2 === 0 ? 1 : 0) : 0)));
  }, [numPages, step, showRight]);

  const prev = useCallback(() => {
    setPage((p) => Math.max(1, p - step));
  }, [step]);

  if (!fileUrl) {
    return (
      <div className="p-4 text-sm text-[#7b6c61] bg-white/80 rounded-xl border border-[#e7d8c9]">
        ไม่พบไฟล์ PDF
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex justify-between mb-3">
        <div className="text-sm text-[#7b6c61]">
          หน้า {page}
          {showRight ? `–${page + 1}` : ""} / {numPages}
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 rounded-lg border border-[#e7d8c9] hover:bg-[#fff7ee]"
            onClick={prev}
          >
            ← ก่อนหน้า
          </button>
          <button
            className="px-3 py-1.5 rounded-lg border border-[#e7d8c9] hover:bg-[#fff7ee]"
            onClick={next}
          >
            ถัดไป →
          </button>
          <button
            className="px-3 py-1.5 rounded-lg border border-[#e7d8c9]"
            onClick={() => setScale((s) => Math.max(0.7, s - 0.1))}
            title="ซูมออก"
          >
            –
          </button>
          <button
            className="px-3 py-1.5 rounded-lg border border-[#e7d8c9]"
            onClick={() => setScale((s) => Math.min(2, s + 0.1))}
            title="ซูมเข้า"
          >
            +
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div className="rounded-xl overflow-hidden bg-white ring-1 ring-[#e7d8c9]">
        <Document
          file={fileUrl}
          onLoadSuccess={onLoadSuccess}
          loading={<div className="p-6 text-[#7b6c61]">กำลังโหลด PDF...</div>}
        >
          <div className="flex justify-center gap-2 p-2">
            <Page
              pageNumber={page}
              height={height}
              scale={scale}
              renderAnnotationLayer
              renderTextLayer
            />
            {showRight && (
              <Page
                pageNumber={page + 1}
                height={height}
                scale={scale}
                renderAnnotationLayer
                renderTextLayer
              />
            )}
          </div>
        </Document>
      </div>
    </div>
  );
}
