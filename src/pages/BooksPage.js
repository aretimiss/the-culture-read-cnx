import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import BackToTop from "../components/BackToTop";
import BookCard from "../components/BookCard";
import PdfOverlay from "../components/PdfOverlay";

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

const fetchJsonWithProxies = async (finalUrl) => {
  try {
    const viaAllorigins = `https://api.allorigins.win/get?url=${encodeURIComponent(finalUrl)}`;
    const r1 = await axios.get(viaAllorigins, { timeout: 15000 });
    return JSON.parse(r1.data.contents);
  } catch {}
  try {
    const viaCodetabs = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(finalUrl)}`;
    const r2 = await axios.get(viaCodetabs, { timeout: 15000 });
    return r2.data;
  } catch {}
  const r3 = await axios.get(finalUrl, { timeout: 15000 });
  return r3.data;
};

/** ====== helpers for card text ====== */
const titleOf = (item) =>
  item["o:title"] || item["dcterms:title"]?.[0]?.["@value"] || "ไม่มีชื่อเอกสาร";
const descOf = (item) =>
  item["dcterms:abstract"]?.[0]?.["@value"] ||
  item["dcterms:description"]?.[0]?.["@value"] ||
  "";
const createdOf = (item) => {
  const iso = item?.["o:created"]?.["@value"];
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
};

/** ====== FilterSection & Pagination (เหมือนเดิม) ====== */
// ... (คุณจะคงของเดิมไว้ได้เลย — ไม่ต้องแก้)

/** ====== หน้า BooksPage (เฉพาะส่วนที่ต่าง: เปิด overlay) ====== */
export default function BooksPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");

  const [page, setPage] = useState(1);
  const perPage = 9;

  // สถานะ Overlay
  const [readerId, setReaderId] = useState(null);  // เก็บ id ที่จะส่งเข้า PdfOverlay

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchJsonWithProxies(api("/items"));
        setItems(Array.isArray(data) ? data : []);
        setErr("");
      } catch (e) {
        setErr(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ค้นหาแบบง่าย (คุณจะใส่ facets ต่อได้เหมือนเดิม)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const t = titleOf(it).toLowerCase();
      const d = descOf(it).toLowerCase();
      return !q || t.includes(q) || d.includes(q);
    });
  }, [items, query]);

  const total = filtered.length;
  const start = (page - 1) * perPage;
  const paged = filtered.slice(start, start + perPage);

  // เปิด overlay: เลือกส่ง id แบบไหนดี
  const openReader = (item) => {
    // 1) แนะนำส่ง media id (ถ้ามี)
    const mediaId = item?.["o:primary_media"]?.["o:id"] || item?.["o:media"]?.[0]?.["o:id"];
    // 2) ถ้าไม่มีเลย ส่ง item id
    const id = mediaId || item?.["o:id"];
    if (!id) return alert("ไม่พบไฟล์ของรายการนี้");
    setReaderId(String(id)); // เปิด overlay
  };

  return (
    <div className="min-h-screen bg-[#fbf6ed] text-[#5b4a3e]">
      <SiteHeader />
      <div className="h-[88px]" />

      {/* HERO Search */}
      <section className="relative w-full h-[360px] md:h-[420px] overflow-hidden">
        <img src="/assets/hero-books.jpg" alt="banner" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 h-full flex items-center justify-center">
          <form
            className="flex w-[90%] max-w-2xl"
            onSubmit={(e) => { e.preventDefault(); setPage(1); }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 h-12 md:h-14 px-4 rounded-l-full bg-white/95 focus:outline-none"
              placeholder="ค้นหาเอกสารตัวเขียน…"
            />
            <button type="submit" className="px-5 md:px-6 rounded-r-full bg-[#f08a24] text-white font-bold">
              ค้นหา
            </button>
          </form>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        {loading ? (
          <div className="py-20 text-center">กำลังโหลด…</div>
        ) : err ? (
          <div className="py-20 text-center text-red-600">เกิดข้อผิดพลาด: {err}</div>
        ) : paged.length === 0 ? (
          <div className="py-20 text-center">ไม่พบรายการที่ตรงกับเงื่อนไข</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {paged.map((it) => (
                <BookCard key={it["o:id"]} item={it} onOpen={openReader} />
              ))}
            </div>
            {/* ใส่ Pagination ของคุณตามเดิมได้เลย */}
          </>
        )}
      </div>

      {/* Overlay (แสดงเมื่อมี readerId) */}
      {readerId && (
        <PdfOverlay id={readerId} onClose={() => setReaderId(null)} />
      )}

      <BackToTop />
      <Footer />
    </div>
  );
}
