// ===== ต้อง import CSS ด้านบนสุด =====
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// ✅ ตั้งค่า workerSrc แบบที่ใช้ได้กับ Webpack/CRA
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs", // ใช้ .mjs ของ pdfjs 5.x
  import.meta.url
).toString();

export default function InlinePdfSpread({
  fileUrl,
  className = "",
  mobileEdge = true,
}) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [isWide, setIsWide] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : false
  );

  const wrapRef = useRef(null);
  const [wrapWidth, setWrapWidth] = useState(0);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setWrapWidth(entry.contentRect.width);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isWide && page % 2 === 0) setPage((p) => Math.max(1, p - 1));
  }, [isWide, page]);

  const onLoadSuccess = ({ numPages }) => setNumPages(numPages);
  const showRight = isWide && page + 1 <= numPages;

  const gap = 12;
  const singleWidth = Math.max(250, wrapWidth);
  const doubleWidth = Math.max(250, (wrapWidth - gap) / 2);

  const step = showRight ? 2 : 1;
  const next = useCallback(() => {
    setPage((p) =>
      Math.min(
        p + step,
        showRight ? (numPages % 2 === 0 ? numPages - 1 : numPages) : numPages
      )
    );
  }, [numPages, step, showRight]);

  const prev = useCallback(() => setPage((p) => Math.max(1, p - step)), [step]);

  // gestures
  const touchX = useRef(0);
  const onTouchStart = (e) => (touchX.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    const delta = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(delta) > 40) delta < 0 ? next() : prev();
  };

  // jump
  const [jump, setJump] = useState("");
  const doJump = () => {
    const n = parseInt(jump, 10);
    if (!n || n < 1) return;
    setPage(showRight && n % 2 === 0 ? Math.max(1, n - 1) : Math.min(n, numPages));
    setJump("");
  };

  if (!fileUrl) {
    return (
      <div className="p-4 text-sm text-[#7b6c61] bg-white/80 rounded-xl border border-[#e7d8c9]">
        ไม่พบไฟล์ PDF
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={[
        "relative w-full rounded-2xl bg-white/90 ring-1 ring-[#e7d8c9] overflow-hidden",
        mobileEdge ? "-mx-4 sm:mx-0" : "",
        className,
      ].join(" ")}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* header */}
      <div className="absolute top-2 left-2 right-2 z-20 flex justify-between text-[13px]">
        <div className="px-2 py-1 rounded bg-white/70 text-[#5b4a3e] shadow">
          หน้า {page}
          {showRight ? `–${page + 1}` : ""} / {numPages}
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={numPages}
            value={jump}
            onChange={(e) => setJump(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doJump()}
            placeholder="ไปหน้า..."
            className="w-20 px-2 py-1 rounded border border-[#e7d8c9] bg-white/80 outline-none focus:ring-1 focus:ring-[#d8653b]"
          />
          <button
            onClick={doJump}
            className="px-2 py-1 rounded bg-[#d8653b] text-white/95 hover:opacity-90"
          >
            ไป
          </button>
        </div>
      </div>

      {/* nav buttons */}
      <button
        onClick={prev}
        className="hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-black/25 text-white hover:bg-black/40"
      >
        ←
      </button>
      <button
        onClick={next}
        className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-black/25 text-white hover:bg-black/40"
      >
        →
      </button>

      {/* zoom */}
      <div className="absolute top-2 right-2 z-20 hidden sm:flex gap-1">
        <button
          onClick={() => setScale((s) => Math.max(0.7, s - 0.1))}
          className="px-2 py-1 rounded bg-white/70 hover:bg-white"
        >
          –
        </button>
        <button
          onClick={() => setScale((s) => Math.min(2, s + 0.1))}
          className="px-2 py-1 rounded bg-white/70 hover:bg-white"
        >
          +
        </button>
      </div>

      {/* viewer */}
      <Document
        file={fileUrl}
        onLoadSuccess={onLoadSuccess}
        onLoadError={(e) => console.error("PDF load error:", e?.message || e)}
        loading={<div className="p-6 text-[#7b6c61]">กำลังโหลด PDF...</div>}
      >
        <div className="flex justify-center p-2 gap-3">
          <Page
            pageNumber={page}
            width={(showRight ? doubleWidth : singleWidth) * scale}
            renderAnnotationLayer
            renderTextLayer
          />
          {showRight && (
            <Page
              pageNumber={page + 1}
              width={doubleWidth * scale}
              renderAnnotationLayer
              renderTextLayer
            />
          )}
        </div>
      </Document>
    </div>
  );
}
