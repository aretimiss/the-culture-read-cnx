// ===== CSS ต้องอยู่บนสุด =====
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Document, Page, pdfjs } from "react-pdf";

// Worker สำหรับ Vite + pdfjs 5.x
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

/**
 * InlinePdfSpread
 * - แสดง PDF แบบหน้าคู่เฉพาะจอกว้าง / หน้าเดี่ยวบนจอเล็ก
 * - เต็มความกว้างคอนเทนเนอร์ (คำนวณ width จาก ResizeObserver)
 * - ปุ่มลอยซ้อนบนหน้า (prev/next/zoom) + ช่องใส่เลขหน้า + ปัดซ้าย/ขวาได้
 *
 * props:
 *  - fileUrl: URL ของไฟล์ PDF
 *  - className: string (ใส่พวก -mx-4 บนมือถือ เพื่อให้ชิดขอบได้มากขึ้น)
 *  - mobileEdge: true จะดันให้ชิดขอบมือถือ (ใช้ -mx-4)
 */
export default function InlinePdfSpread({
  fileUrl,
  className = "",
  mobileEdge = true,
}) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1); // หน้าเริ่ม/ซ้าย
  const [scale, setScale] = useState(1);
  const [isWide, setIsWide] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : false
  );

  // จับขนาดคอนเทนเนอร์เพื่อคำนวณความกว้างของ Page
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

  // อัปเดตโหมด (คู่/เดี่ยว) ตามการ resize หน้าจอ
  useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 1024);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ถ้าเข้าโหมดหน้าคู่ ให้หน้าเป็นเลขคี่ (อยู่ซ้าย)
  useEffect(() => {
    if (isWide && page % 2 === 0) setPage((p) => Math.max(1, p - 1));
  }, [isWide, page]);

  const onLoadSuccess = ({ numPages }) => setNumPages(numPages);
  const showRight = isWide && page + 1 <= numPages;

  // คำนวณความกว้างแต่ละหน้าให้เต็ม (ซ้าย/ขวาแบ่งกัน)
  const gap = 12; // ช่องว่างระหว่างหน้า (px)
  const singleWidth = Math.max(200, Math.floor(wrapWidth * 1)); // หน้าเดี่ยว
  const doubleWidth = Math.max(
    200,
    Math.floor((wrapWidth - gap) / 2)
  ); // แต่ละหน้าของหน้าคู่

  const step = showRight ? 2 : 1;

  const next = useCallback(() => {
    setPage((p) =>
      Math.min(
        p + step,
        // ถ้าเป็นหน้าคู่ อย่าให้ซ้ายเกินหน้าสุดท้ายที่จับคู่ได้
        showRight ? (numPages % 2 === 0 ? numPages - 1 : numPages) : numPages
      )
    );
  }, [numPages, step, showRight]);

  const prev = useCallback(() => {
    setPage((p) => Math.max(1, p - step));
  }, [step]);

  // ปัดซ้าย/ขวา
  const touchX = useRef(0);
  const onTouchStart = (e) => (touchX.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    const delta = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(delta) > 40) {
      if (delta < 0) next(); // ปัดซ้าย -> ไปหน้าใหม่
      else prev(); // ปัดขวา -> ย้อนกลับ
    }
  };

  // ใส่เลขหน้าเพื่อข้าม
  const [jump, setJump] = useState("");
  const doJump = () => {
    const n = parseInt(jump, 10);
    if (!n || n < 1) return;
    if (showRight && n % 2 === 0) {
      // ถ้าหน้าคู่ ให้ไปหน้าเลขคี่ (ซ้าย) ที่อยู่ก่อนหน้าเลขที่กรอก
      setPage(Math.max(1, n - 1));
    } else {
      setPage(Math.min(n, numPages));
    }
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
        // มือถือให้ชิดขอบมากขึ้น
        mobileEdge ? "-mx-4 sm:mx-0" : "",
        className,
      ].join(" ")}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* แถบด้านบน: เลขหน้า + jump */}
      <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between text-[13px]">
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
            title="ใส่เลขหน้าแล้วกด Enter"
          />
          <button
            onClick={doJump}
            className="px-2 py-1 rounded bg-[#d8653b] text-white/95 hover:opacity-90"
            title="ข้ามไปหน้า"
          >
            ไป
          </button>
        </div>
      </div>

      {/* ปุ่มลอยซ้าย/ขวา (จาง) */}
      <button
        onClick={prev}
        className="hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 z-20
                   w-10 h-10 items-center justify-center rounded-full
                   bg-black/25 text-white hover:bg-black/40 transition"
        title="ก่อนหน้า"
      >
        ←
      </button>
      <button
        onClick={next}
        className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 z-20
                   w-10 h-10 items-center justify-center rounded-full
                   bg-black/25 text-white hover:bg-black/40 transition"
        title="ถัดไป"
      >
        →
      </button>

      {/* ปุ่มซูมเล็ก ๆ มุมขวาบน */}
      <div className="absolute top-2 right-2 z-20 hidden sm:flex gap-1">
        <button
          onClick={() => setScale((s) => Math.max(0.7, s - 0.1))}
          className="px-2 py-1 rounded bg-white/70 hover:bg-white"
          title="ซูมออก"
        >
          –
        </button>
        <button
          onClick={() => setScale((s) => Math.min(2, s + 0.1))}
          className="px-2 py-1 rounded bg-white/70 hover:bg-white"
          title="ซูมเข้า"
        >
          +
        </button>
      </div>

      {/* ตัวแสดงเอกสาร */}
      <Document
        file={fileUrl}
        onLoadSuccess={onLoadSuccess}
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
