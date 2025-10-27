import React, { useEffect, useMemo, useState } from "react";
import "../HomePage.css";

import SiteHeader from "../components/SiteHeader";
import ParallaxHero from "../components/ParallaxHero";
import Footer from "../components/Footer";
import BookCard from "../components/BookCard";
import AutoCarousel from "../components/AutoCarousel";

import {
  fetchItemsLite,
  titleOf,
  descOf,
  openPDFOf,
} from "../lib/omekaClient";

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchItemsLite({
        limit: 12,
        sortBy: "created",
        sortOrder: "desc",
      });
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
    return items
      .filter((it) => {
        const t = (titleOf(it) || "").toLowerCase();
        const d = (descOf(it) || "").toLowerCase();
        return t.includes(q) || d.includes(q);
      })
      .slice(0, 12);
  }, [items, query]);

  const openPDF = async (item) => {
    try {
      await openPDFOf(item);
    } catch (e) {
      alert(e?.message || "เปิดไฟล์ไม่สำเร็จ");
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#111518]">
      <SiteHeader />
      <ParallaxHero
        banner="/assets/banner.webp"
        onSearch={(q) => setQuery(q)}
      />

      {/* Layout หลัก */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ฝั่งซ้าย 2 ช่อง */}
          <div className="lg:col-span-2 space-y-8">
            <section className="card-soft h-[620px] flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">แนะนำหนังสือ</h2>
                <p className="opacity-80">
                  บล็อก/บทความรีวิวหนังสือสำหรับ SEO (แก้ไขเนื้อหาภายหลังได้)
                </p>
              </div>
            </section>

            <section className="card-soft h-[620px] flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">กิจกรรม/ข่าวสาร</h2>
                <p className="opacity-80">
                  บอร์ดกิจกรรมเกี่ยวกับหนังสือ/คลังเอกสาร
                </p>
              </div>
            </section>
          </div>

          {/* ฝั่งขวา 2 ช่องสไลด์อัตโนมัติ */}
          <aside className="flex flex-col gap-8">
            {(() => {
              const uniq = Array.from(new Map(filtered.map(it => [it["o:id"], it])).values());
              const a = uniq.filter((_, i) => i % 2 === 0).slice(0, 3);
              const b = uniq.filter((_, i) => i % 2 === 1).slice(0, 3);
              const rest = uniq.filter(it => !a.includes(it) && !b.includes(it));
              while (a.length < 3 && rest.length) a.push(rest.shift());
              while (b.length < 3 && rest.length) b.push(rest.shift());

              return (
                <>
                  <AutoCarousel
                    title="แนะนำหนังสือหายาก"
                    items={loading || err ? [] : a}
                    onOpen={openPDF}
                    className="h-[620px]"
                  />
                  <AutoCarousel
                    title="แนะนำเอกสารโบราณ"
                    items={loading || err ? [] : b}
                    onOpen={openPDF}
                    className="h-[620px]"
                  />
                </>
              );
            })()}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
