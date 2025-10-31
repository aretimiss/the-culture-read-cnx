// src/components/ManuscriptCard.jsx
import React, { useEffect, useState } from "react";
import { thumbUrlOf } from "../lib/omekaClient";

/** การ์ดสำหรับ Manuscript ที่แสดง "เฉพาะภาพ" */
export default function ManuscriptCard({ item, onClick }) {
  const [thumb, setThumb] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const url = await thumbUrlOf(item);
      if (alive) setThumb(url);
    })();
    return () => { alive = false; };
  }, [item]);

  return (
    <button
      onClick={onClick}
      className="group relative w-full aspect-[3/4] overflow-hidden rounded-xl shadow-sm bg-white hover:shadow-md transition"
      title="คลิกเพื่อเปิดอ่าน"
    >
      {thumb ? (
        <img
        src={thumb}
        alt=""
        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full grid place-items-center bg-gray-100 text-gray-400 text-sm">
          ไม่มีภาพ
        </div>
      )}
    </button>
  );
}
