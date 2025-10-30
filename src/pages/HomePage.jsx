// src/pages/HomePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./HomePage.css"; // ✅ แก้ path ให้ถูกต้อง

import SiteHeader from "../components/SiteHeader";
import ParallaxHero from "../components/ParallaxHero";
import Footer from "../components/Footer";
import AutoCarousel from "../components/AutoCarousel";

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../i18n"; // ✅ ตรวจว่ามี src/i18n/index.js
import { fetchItemsLite } from "../lib/omekaClient";
import { pickLang } from "../lib/i18nPick"; // ✅ ต้องมี src/lib/i18nPick.js

export default function HomePage() {
  const { t } = useTranslation();

  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    load();
    // iOS Safari ไม่ชอบ background-attachment: fixed; ปรับอัตโนมัติบนจอเล็ก
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () =>
      document.documentElement.style.setProperty(
        "--bg-attach",
        mq.matches ? "scroll" : "fixed"
      );
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
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
      setErr(e?.message || t("errors.loadFailed", "โหลดข้อมูลไม่สำเร็จ"));
    } finally {
      setLoading(false);
    }
  };

  // ✅ ดึง title/desc ตามภาษา (fallback -> en -> ค่าแรก)
  const titleOfItem = (it) =>
    pickLang(it?.["dcterms:title"], i18n.language) || "";
  const descOfItem = (it) =>
    pickLang(it?.["dcterms:description"], i18n.language) || "";

  const filtered = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    if (!query.trim()) return list.slice(0, 12);
    const q = query.toLowerCase();
    return list
      .filter((it) => {
        const t0 = (titleOfItem(it) || "").toLowerCase();
        const d0 = (descOfItem(it) || "").toLowerCase();
        return t0.includes(q) || d0.includes(q);
      })
      .slice(0, 12);
  }, [items, query, i18n.language]);

  // ✅ ไปหน้าอ่าน
  const openPDF = (item) => {
    const id = item?.["o:id"];
    if (!id) return alert(t("errors.noId", "ไม่พบรหัสรายการ"));
    navigate(`/read/${id}`);
  };

  // ✅ แยกชุดสำหรับ 2 สไลด์
  const { a, b } = useMemo(() => {
    const uniq = Array.from(
      new Map(filtered.map((it) => [it["o:id"], it])).values()
    );
    const A = [];
    const B = [];
    uniq.forEach((it, idx) => (idx % 2 === 0 ? A.push(it) : B.push(it)));
    while (A.length < 3 && B.length > 3) A.push(B.pop());
    while (B.length < 3 && A.length > 3) B.push(A.pop());
    return { a: A.slice(0, 3), b: B.slice(0, 3) };
  }, [filtered]);

  return (
    <div
      className="min-h-screen text-[#111518]"
      style={{
        backgroundImage: "url('/assets/banner.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "var(--bg-attach, fixed)",
      }}
    >
      <SiteHeader />

      {/* ✅ Hero + ค้นหา (รองรับมือถือ) */}
      <ParallaxHero
        banner=""
        onSearch={setQuery}
        searchPlaceholder={t("search.placeholder", "ค้นหาหนังสือ/คำอธิบาย…")}
      />

      {/* ✅ Layout หลัก */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* ซ้ายบน */}
          <section className="card-soft h-[420px] sm:h-[520px] lg:h-[620px] flex items-center justify-center lg:col-start-1 lg:col-span-2">
            <div className="text-center px-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
                {t("sections.recommendBooks", "แนะนำหนังสือ")}
              </h2>
              <p className="opacity-80 text-sm sm:text-base">
                {t(
                  "sections.recommendBooksDesc",
                  "บล็อก/บทความรีวิวหนังสือสำหรับ SEO (แก้ไขเนื้อหาภายหลังได้)"
                )}
              </p>
            </div>
          </section>

          {/* ขวาบน */}
          <aside className="lg:col-start-3">
            <AutoCarousel
              title={t("sections.rareBooks", "แนะนำหนังสือหายาก")}
              items={loading || err ? [] : a}
              onOpen={openPDF}
              className="h-[420px] sm:h-[520px] lg:h-[620px]"
            />
          </aside>

          {/* ซ้ายล่าง */}
          <aside className="lg:col-start-1 lg:row-start-2">
            <AutoCarousel
              title={t("sections.ancientDocs", "แนะนำเอกสารโบราณ")}
              items={loading || err ? [] : b}
              onOpen={openPDF}
              className="h-[420px] sm:h-[520px] lg:h-[620px]"
            />
          </aside>

          {/* ขวาล่าง */}
          <section className="card-soft h-[420px] sm:h-[520px] lg:h-[620px] flex items-center justify-center lg:col-start-2 lg:col-span-2 lg:row-start-2">
            <div className="text-center px-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
                {t("sections.activities", "กิจกรรม/ข่าวสาร")}
              </h2>
              <p className="opacity-80 text-sm sm:text-base">
                {t(
                  "sections.activitiesDesc",
                  "บอร์ดกิจกรรมเกี่ยวกับหนังสือ/คลังเอกสาร"
                )}
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
