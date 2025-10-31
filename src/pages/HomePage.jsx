// src/pages/HomePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./HomePage.css";

import SiteHeader from "../components/SiteHeader";
import ParallaxHero from "../components/ParallaxHero";
import Footer from "../components/Footer";
import AutoCarousel from "../components/AutoCarousel";
import ManuscriptCard from "../components/ManuscriptCard"; // ✅ เพิ่ม

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { fetchItemsLite } from "../lib/omekaClient";
import { pickLang } from "../lib/i18nPick";

/** ===== แถบรายชื่อเอกสารโบราณ (เลื่อนแนวนอน) ===== */
function TitleTicker({ items = [], titleOfItem, onClick }) {
  if (!items?.length) {
    return (
      <div className="w-full py-2 text-center text-sm text-black/50">—</div>
    );
  }
  return (
    <div className="w-full overflow-x-auto whitespace-nowrap no-scrollbar border-t border-black/10 bg-white/60">
      <ul className="flex gap-4 px-3 py-2">
        {items.map((it) => (
          <li
            key={it["o:id"]}
            className="text-sm sm:text-[15px] hover:underline cursor-pointer text-[#5b4a3e]"
            onClick={() => onClick?.(it)}
            title={titleOfItem(it)}
          >
            {titleOfItem(it)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ชุดข้อมูลตามหมวด
  const [books, setBooks] = useState([]);
  const [manuscripts, setManuscripts] = useState([]);
  const [articles, setArticles] = useState([]);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // helpers: multi-lang
  const titleOfItem = (it) => pickLang(it?.["dcterms:title"], i18n.language) || "";
  const descOfItem  = (it) => pickLang(it?.["dcterms:description"], i18n.language) || "";

  const openPDF = (item) => {
    const id = item?.["o:id"];
    if (!id) return alert(t("errors.noId", "ไม่พบรหัสรายการ"));
    navigate(`/read/${id}`);
  };

  useEffect(() => {
    // ปรับ backgroundAttachment สำหรับจอเล็ก (iOS Safari)
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () =>
      document.documentElement.style.setProperty("--bg-attach", mq.matches ? "scroll" : "fixed");
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        // ✅ ดึงตามคลาส (ใช้ resource_class_label)
        const [bks, manus, arts] = await Promise.all([
          fetchItemsLite({ limit: 12, sortBy: "created", sortOrder: "desc", resource_class_label: "Book" }),
          fetchItemsLite({ limit: 12, sortBy: "created", sortOrder: "desc", resource_class_label: "Manuscript" }),
          fetchItemsLite({ limit: 8,  sortBy: "created", sortOrder: "desc", resource_class_label: "Article" }),
        ]);

        setBooks(Array.isArray(bks) ? bks : []);
        setManuscripts(Array.isArray(manus) ? manus : []);
        setArticles(Array.isArray(arts) ? arts : []);
      } catch (e) {
        setErr(e?.message || t("errors.loadFailed", "โหลดข้อมูลไม่สำเร็จ"));
      } finally {
        setLoading(false);
      }
    })();
  }, [i18n.language]);

  // ค้นหาในหน้า (filter ชุดข้อมูลทั้งหมด)
  const filterByQuery = (arr) => {
    if (!query.trim()) return arr || [];
    const q = query.toLowerCase();
    return (arr || []).filter((it) => {
      const t0 = (titleOfItem(it) || "").toLowerCase();
      const d0 = (descOfItem(it) || "").toLowerCase();
      return t0.includes(q) || d0.includes(q);
    });
  };

  const booksFiltered       = useMemo(() => filterByQuery(books).slice(0, 9), [books, query, i18n.language]);
  const manuscriptsFiltered = useMemo(() => filterByQuery(manuscripts).slice(0, 9), [manuscripts, query, i18n.language]);
  const articlesFiltered    = useMemo(() => filterByQuery(articles).slice(0, 6), [articles, query, i18n.language]);

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

      {/* Banner + Search */}
      <ParallaxHero
        banner=""
        onSearch={setQuery}
        searchPlaceholder={t("search.placeholder", "ค้นหาหนังสือ/คำอธิบาย…")}
      />

      {/* ===== Layout ตามภาพ: ซ้าย(ใหญ่) + ขวา(หนังสือใหม่) ===== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

          {/* ซ้ายบน: เอกสารโบราณ (Manuscript) + แถบชื่อด้านล่าง */}
          <section className="lg:col-start-1 lg:col-span-2 card-soft flex flex-col">
            <div className="flex-1 px-4 py-6 sm:py-10">
              <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#5b4a3e]">
                  แนะนำเอกสารโบราณ (Manuscript)
                </h2>
                <p className="mt-2 text-sm sm:text-base text-black/70">
                  ดึงจากคลาส <strong>Manuscript</strong> ใน Omeka S (ล่าสุดก่อน)
                </p>
              </div>

              {/* ✅ แสดงเฉพาะภาพ 3 รายการ (คลิกแล้วไปอ่าน) */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 justify-items-center">
                {(loading || err ? [] : manuscriptsFiltered.slice(0, 3)).map((it) => (
                  <ManuscriptCard
                    key={it["o:id"]}
                    item={it}
                    onClick={() => openPDF(it)}
                  />
                ))}
              </div>
            </div>

            {/* แถบรายชื่อเอกสารโบราณ (เลื่อนขวาซ้ายได้) */}
            <TitleTicker
              items={loading || err ? [] : manuscriptsFiltered}
              titleOfItem={titleOfItem}
              onClick={openPDF}
            />
          </section>

          {/* ขวาบน: หนังสืออัปใหม่ (Book) */}
          <aside className="lg:col-start-3">
            <AutoCarousel
              title="แนะนำหนังสืออัปใหม่ (Book)"
              items={loading || err ? [] : booksFiltered}
              onOpen={openPDF}
              className="h-[420px] sm:h-[520px] lg:h-[620px]"
            />
          </aside>

          {/* ซ้ายล่าง: บทความ/กิจกรรม (Article) */}
          <section className="lg:col-start-1 lg:col-span-2 card-soft flex flex-col justify-center">
            <div className="px-4 py-6 sm:py-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#5b4a3e] text-center">
                บทความ / กิจกรรม
              </h2>
              <p className="text-center mt-2 text-sm sm:text-base text-black/70">
                โชว์รายการล่าสุดจากคลาส <strong>Article</strong>
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(loading || err ? [] : articlesFiltered).map((it) => (
                  <button
                    key={it["o:id"]}
                    onClick={() => openPDF(it)}
                    className="group border rounded-xl p-4 bg-white/70 hover:bg-white text-left transition shadow-sm"
                  >
                    <div className="font-semibold text-[#5b4a3e] line-clamp-2 group-hover:underline">
                      {titleOfItem(it) || "—"}
                    </div>
                    <div className="mt-2 text-xs text-black/60 line-clamp-3">
                      {descOfItem(it) || ""}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
