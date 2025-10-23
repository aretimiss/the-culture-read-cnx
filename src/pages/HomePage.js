// src/pages/HomePage.js
import React, { useEffect, useMemo, useState } from "react";
import "../HomePage.css";

import SiteHeader from "../components/SiteHeader";
import Hero from "../components/Hero";
import BookCard from "../components/BookCard";
import Footer from "../components/Footer";

import {
  api,
  fetchJsonWithProxies,
  titleOf,
  descOf,
  openPDFOf,
} from "../lib/omekaClient";

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      if (!process.env.REACT_APP_API_KEY_IDENTITY || !process.env.REACT_APP_API_KEY_CREDENTIAL) {
        throw new Error("API keys not found. Please check your .env file.");
      }
      const data = await fetchJsonWithProxies(api("/items"));
      setItems(Array.isArray(data) ? data : []);
      setErr("");
    } catch (e) {
      setErr(e?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return items.slice(0, 12);
    const q = query.toLowerCase();
    return items.filter((it) => {
      const t = titleOf(it).toLowerCase();
      const d = (descOf(it) || "").toLowerCase();
      return t.includes(q) || d.includes(q);
    }).slice(0, 12);
  }, [items, query]);

  const openPDF = async (item) => {
    try { await openPDFOf(item); } 
    catch (e) { alert(e?.message || "เปิดไฟล์ไม่สำเร็จ"); }
  };

  return (
    <div className="min-h-screen bg-background-light text-[#111518]">
      <SiteHeader />
      {/* เว้นที่สำหรับ header fixed */}
      <div className="h-[88px]" />
      <main className="flex-1">
        <Hero query={query} setQuery={setQuery} onSearch={() => { /* อนาคตอาจลิงก์ไป /books พร้อม query */ }} />

        <section className="px-4 sm:px-10 lg:px-40">
          <h2 className="section-title">อยู่ในช่วงพัฒนา</h2>

          {loading ? (
            <div className="state">กำลังโหลด…</div>
          ) : err ? (
            <div className="state text-red-500">เกิดข้อผิดพลาด: {err}</div>
          ) : filtered.length === 0 ? (
            <div className="state">ไม่พบรายการ</div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] items-stretch gap-6 p-4">
              {filtered.map((item) => (
                <BookCard key={item["o:id"]} item={item} onOpen={openPDF} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
