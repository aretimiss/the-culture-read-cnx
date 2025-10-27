import React, { useRef, useEffect, useState } from "react";

export default function InlinePdfSimple({
  fileUrl,
  className = "",
  mobileEdge = true,
  height = "80vh",
}) {
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

  if (!fileUrl) {
    return (
      <div className="p-4 text-sm text-[#7b6c61] bg-white/80 rounded-xl border border-[#e7d8c9]">
        ไม่พบไฟล์ PDF
      </div>
    );
  }

  // แสดง PDF ตรงผ่าน iframe
  // ใช้ #view=FitH เพื่อให้พอดีกับแนวนอน
  const iframeSrc = `${fileUrl}#view=FitH`;

  return (
    <div
      ref={wrapRef}
      className={[
        "relative w-full rounded-2xl bg-white/90 ring-1 ring-[#e7d8c9] overflow-hidden",
        mobileEdge ? "-mx-4 sm:mx-0" : "",
        className,
      ].join(" ")}
      style={{ height }}
    >
      <iframe
        src={iframeSrc}
        title="PDF Viewer"
        className="w-full h-full border-0"
        allow="fullscreen"
      />
    </div>
  );
}
