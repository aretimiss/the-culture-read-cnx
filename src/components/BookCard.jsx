// src/components/BookCard.jsx
import React, { useEffect, useState } from "react";
import { titleOf, thumbUrlOf } from "../lib/omekaClient";
import { useTranslation } from "react-i18next";

/** --- Placeholder fallback --- */
function CoverPlaceholder({ label = "No cover" }) {
  return (
    <div className="w-full h-full grid place-items-center rounded-lg bg-gradient-to-br from-black/5 to-black/10">
      <div className="flex flex-col items-center gap-2 text-[11px] md:text-xs text-black/50">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4.5 5.5A2.5 2.5 0 0 1 7 3h11v16H7a2.5 2.5 0 0 0-2.5 2.5V5.5Z"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path d="M7 6h7M7 9h8" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        <span>{label}</span>
      </div>
    </div>
  );
}

/** --- การ์ดหนังสือ --- */
export default function BookCard({
  item,
  onOpen,
  compact = false,
  titleOverride,
  descOverride,
}) {
  const { t, i18n } = useTranslation();
  const [imgUrl, setImgUrl] = useState(null);
  const [hasImg, setHasImg] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setImgUrl(null);
    setHasImg(false);

    (async () => {
      try {
        const url = await thumbUrlOf(item);
        if (!active) return;
        if (url) {
          setImgUrl(url);
          setHasImg(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [item]);

  // ✅ ชื่อหนังสือ: ใช้ props ถ้ามี, ถ้าไม่มี fallback ไป titleOf()
  const title = titleOverride || titleOf(item) || t("books.untitled", "ไม่มีชื่อเรื่อง");
  const desc = descOverride || "";

  // ✅ ฟังก์ชันเปิดอ่าน
  const handleOpen = () => {
    if (onOpen) return onOpen(item);
    console.warn("BookCard: onOpen is not provided. No navigation performed.");
  };

  /** --- โหมด compact (รายการฝั่งขวา) --- */
  if (compact) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="flex gap-3 w-full text-left hover:bg-black/5 rounded-xl p-2 transition"
      >
        <div className="w-16 h-24 rounded-lg overflow-hidden bg-black/5 flex-none">
          {loading ? (
            <div className="w-full h-full animate-pulse bg-black/10" />
          ) : hasImg ? (
            <img
              src={imgUrl}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              draggable="false"
            />
          ) : (
            <CoverPlaceholder />
          )}
        </div>
        <div className="flex-1">
          <div className="font-semibold leading-snug line-clamp-2">{title}</div>
          <div className="text-sm opacity-60">{t("actions.open", "คลิกเพื่อเปิดอ่าน")}</div>
        </div>
      </button>
    );
  }

  /** --- โหมดเต็ม (หน้าแสดงรายการหลัก) --- */
  return (
    <button
      type="button"
      onClick={handleOpen}
      className="group w-full h-full text-left rounded-2xl overflow-hidden ring-1 ring-black/10 bg-white hover:shadow-xl transition"
    >
      <div className="aspect-[3/4] bg-black/5">
        {loading ? (
          <div className="w-full h-full animate-pulse bg-black/10" />
        ) : hasImg ? (
          <img
            src={imgUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            draggable="false"
          />
        ) : (
          <CoverPlaceholder />
        )}
      </div>
      <div className="p-3">
        <h4 className="font-bold leading-snug line-clamp-2">{title}</h4>
        {desc && (
          <p className="text-sm opacity-70 line-clamp-2 mt-1">{desc}</p>
        )}
        <div className="mt-1 text-sm opacity-60">
          {t("actions.open", "คลิกเพื่อเปิดอ่าน")}
        </div>
      </div>
    </button>
  );
}
