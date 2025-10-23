import React from "react";

/** ====== Small helpers ====== */
const titleOf = (item) =>
  item["o:title"] || item["dcterms:title"]?.[0]?.["@value"] || "ไม่มีชื่อเอกสาร";

const descOf = (item) =>
  item["dcterms:abstract"]?.[0]?.["@value"] ||
  item["dcterms:description"]?.[0]?.["@value"] ||
  "";

const thumbOf = (item) =>
  item?.thumbnail_display_urls?.large ||
  item?.thumbnail_display_urls?.medium ||
  item?.thumbnail_display_urls?.square ||
  null;

const createdOf = (item) => {
  const iso = item?.["o:created"]?.["@value"];
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/** ====== BookCard component ====== */
export default function BookCard({ item, onOpen }) {
  const title = titleOf(item);
  const desc = descOf(item);
  const thumb = thumbOf(item);

  return (
    <article className="flex flex-col h-full bg-[#fffdf6] border border-[#f1e9de] rounded-md shadow-sm">
      <div className="w-full bg-[#eee2d3]">
        <div className="relative w-full aspect-[4/3] flex items-center justify-center">
          {thumb ? (
            <img
              src={thumb}
              alt={title}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#efe7db] to-[#faefe1]" />
          )}
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <h3 className="text-[#5b4a3e] font-semibold leading-snug">{title}</h3>
        <div className="text-xs text-[#a36a46]">วันที่สร้าง: {createdOf(item)}</div>
        <p className="text-sm text-[#6c5b4a] line-clamp-3">{desc}</p>
        <div className="mt-2">
          <button
            onClick={() => onOpen(item)} // ✅ เรียกฟังก์ชันจากภายนอก
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#d8653b] text-white text-sm font-semibold hover:bg-[#c85a32]"
          >
            เปิดอ่าน PDF
            <span className="material-symbols-outlined text-base">
              picture_as_pdf
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
