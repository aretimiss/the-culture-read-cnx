import React, { useEffect, useMemo, useState } from "react";
import "../HomePage.css";

import SiteHeader from "../components/SiteHeader";
import ParallaxHero from "../components/ParallaxHero";
import Footer from "../components/Footer";
import AutoCarousel from "../components/AutoCarousel";

import { useNavigate } from "react-router-dom";
import {
  fetchItemsLite,
  titleOf,
  descOf,
} from "../lib/omekaClient";

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

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
    const list = Array.isArray(items) ? items : [];
    if (!query.trim()) return list.slice(0, 12);
    const q = query.toLowerCase();
    return list
      .filter((it) => {
        const t = (titleOf(it) || "").toLowerCase();
        const d = (descOf(it) || "").toLowerCase();
        return t.includes(q) || d.includes(q);
      })
      .slice(0, 12);
  }, [items, query]);

  // ✅ ใช้ navigate ไปหน้าอ่าน
  const openPDF = (item) => {
    const id = item?.["o:id"];
    if (!id) return alert("ไม่พบรหัสรายการ");
    navigate(`/read/${id}`);
  };

  return (
    <div
      className="min-h-screen text-[#111518]"
      style={{
        backgroundImage: "url('/assets/banner.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <SiteHeader />
      <ParallaxHero banner="" onSearch={(q) => setQuery(q)} />

      {/* Layout หลัก */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ซ้ายบน: กล่องใหญ่ (กิน 2 คอลัมน์) */}
          <section className="card-soft h-[620px] flex items-center justify-center lg:col-start-1 lg:col-span-2">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">แนะนำหนังสือ</h2>
              <p className="opacity-80">
                บล็อก/บทความรีวิวหนังสือสำหรับ SEO (แก้ไขเนื้อหาภายหลังได้)
              </p>
            </div>
          </section>

          {(() => {
            // แบ่งรายการเป็น 2 ชุดสำหรับสไลด์ A/B
            const uniq = Array.from(new Map(filtered.map(it => [it["o:id"], it])).values());
            const a = uniq.filter((_, i) => i % 2 === 0).slice(0, 3);
            const b = uniq.filter((_, i) => i % 2 === 1).slice(0, 3);
            const rest = uniq.filter(it => !a.includes(it) && !b.includes(it));
            while (a.length < 3 && rest.length) a.push(rest.shift());
            while (b.length < 3 && rest.length) b.push(rest.shift());

            return (
              <>
                {/* ขวาบน: สไลด์ A */}
                <aside className="lg:col-start-3">
                  <AutoCarousel
                    title="แนะนำหนังสือหายาก"
                    items={loading || err ? [] : a}
                    onOpen={openPDF}
                    className="h-[620px]"
                  />
                </aside>

                {/* ซ้ายล่าง: สไลด์ B */}
                <aside className="lg:col-start-1 lg:row-start-2">
                  <AutoCarousel
                    title="แนะนำเอกสารโบราณ"
                    items={loading || err ? [] : b}
                    onOpen={openPDF}
                    className="h-[620px]"
                  />
                </aside>

                {/* ขวาล่าง: กล่องใหญ่ */}
                <section className="card-soft h-[620px] flex items-center justify-center lg:col-start-2 lg:col-span-2 lg:row-start-2">
                  <div className="text-center">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">กิจกรรม/ข่าวสาร</h2>
                    <p className="opacity-80">บอร์ดกิจกรรมเกี่ยวกับหนังสือ/คลังเอกสาร</p>
                  </div>
                </section>
              </>
            );
          })()}
        </div>
      </main>

      <Footer />
    </div>
  );
}
