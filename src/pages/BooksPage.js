// src/pages/BooksPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import BackToTop from "../components/BackToTop";
import BookCard from "../components/BookCard";

import {
  fetchItemsLite,
  fetchJsonWithProxies,
  withKeys,
  api,
} from "../lib/omekaClient";
import { pickLang } from "../lib/i18nPick";

const ShelfBar = () => (
  <div className="h-3 rounded-full bg-gradient-to-b from-[#e7d8c9] to-[#d9c1a9] shadow-inner" />
);

const ShelfTitle = ({ children }) => (
  <h2 className="text-xl md:text-2xl font-extrabold tracking-wide text-[#5b4a3e] mb-3">
    {children}
  </h2>
);

export default function BooksPage() {
  const { t } = useTranslation();

  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [activeSet, setActiveSet] = useState("all");
  const [setLabels, setSetLabels] = useState({}); // { [id]: labelLocalized }

  const navigate = useNavigate();

  // 1) โหลดรายการหนังสือ
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchItemsLite({
          limit: 60,
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
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) สร้างป้ายชื่อคอลเลกชัน (เปลี่ยนเมื่อภาษาเปลี่ยน)
  useEffect(() => {
    (async () => {
      try {
        const ids = Array.from(
          new Set(
            (Array.isArray(items) ? items : []).flatMap((it) =>
              (Array.isArray(it?.["o:item_set"]) ? it["o:item_set"] : [])
                .map((s) => s?.["o:id"])
                .filter(Boolean)
            )
          )
        );

        if (!ids.length) {
          setSetLabels({});
          return;
        }

        const pairs = await Promise.all(
          ids.map(async (id) => {
            try {
              const r = await fetchJsonWithProxies(withKeys(api(`/item_sets/${id}`)));
              // พยายามใช้ dcterms:title แบบหลายภาษา ถ้าไม่มีค่อย fallback เป็น o:title
              const name =
                pickLang(r?.["dcterms:title"], i18n.language) ||
                r?.["o:title"] ||
                `Collection #${id}`;
              return [String(id), name];
            } catch {
              return [String(id), `Collection #${id}`];
            }
          })
        );
        setSetLabels(Object.fromEntries(pairs));
      } catch {
        // เงียบไว้ ถ้าโหลด label ไม่ได้ ใช้ #id แทน
      }
    })();
  }, [items, i18n.language]);

  // Tabs หมวดหมู่
  const categoryTabs = useMemo(() => {
    const tabs = [{ id: "all", label: t("filters.all", "ทั้งหมด") }];
    const others = Object.entries(setLabels).map(([id, label]) => ({ id, label }));
    return tabs.concat(others);
  }, [setLabels, t]);

  // Filter รายการตามคำค้น + หมวด
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const title = (pickLang(it?.["dcterms:title"], i18n.language) || "").toLowerCase();
      const desc = (pickLang(it?.["dcterms:description"], i18n.language) || "").toLowerCase();

      const hit = !q || title.includes(q) || desc.includes(q);
      if (!hit) return false;

      if (activeSet === "all") return true;
      const sets = Array.isArray(it?.["o:item_set"]) ? it["o:item_set"] : [];
      return sets.some((s) => String(s?.["o:id"]) === String(activeSet));
    });
  }, [items, query, activeSet, i18n.language]);

  // กลุ่มแบบหลายชั้น (กรณี "ทั้งหมด")
  const groupedBySet = useMemo(() => {
    if (activeSet !== "all") return {};
    const groups = {};
    filtered.forEach((it) => {
      const sets = Array.isArray(it?.["o:item_set"]) ? it["o:item_set"] : [];
      if (sets.length === 0) {
        (groups["_none"] ||= []).push(it);
      } else {
        sets.forEach((s) => {
          const key = String(s?.["o:id"] || "_none");
          (groups[key] ||= []).push(it);
        });
      }
    });
    return groups;
  }, [filtered, activeSet]);

  // สำหรับกรณีเลือกเฉพาะคอลเลกชัน
  const singleShelfItems = useMemo(() => {
    if (activeSet === "all") return [];
    return filtered;
  }, [filtered, activeSet]);

  // เปิดอ่าน
  const openBook = (item) => {
    const id = item?.["o:id"];
    if (!id) return alert(t("errors.noId", "ไม่พบรหัสรายการ"));
    navigate(`/read/${id}`);
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#111518]">
      <SiteHeader />

      {/* HERO */}
      <section className="relative h-[46vh] min-h-[360px] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: "url(/assets/banner.webp)" }}
        />
        <div className="absolute inset-0 bg-[#fff1e6]/60" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-wide text-[#5b4a3e] drop-shadow">
            {t("books.title", "ห้องสมุด")}
          </h1>
          <p className="mt-3 max-w-2xl text-[#5b4a3e]/80">
            {t("books.subtitle", "ค้นหาและเลือกดูหนังสือจากคอลเลกชันต่าง ๆ")}
          </p>

          <div className="mt-6 w-full max-w-xl">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex items-center rounded-2xl bg-white/90 ring-1 ring-black/10 shadow"
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search.placeholder", "ค้นหาชื่อหนังสือ / คำสำคัญ...")}
                className="flex-1 px-4 py-3 rounded-2xl bg-transparent outline-none"
              />
              <button className="px-5 py-3 font-semibold">
                {t("actions.search", "ค้นหา")}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Layout: Sidebar + Shelf */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-28 space-y-3 p-4 bg-white/70 backdrop-blur-md rounded-2xl shadow ring-1 ring-black/10">
            <h3 className="font-bold text-[#5b4a3e] mb-2">
              {t("filters.category", "หมวดหมู่")}
            </h3>
            <div className="flex flex-col gap-2">
              {categoryTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSet(tab.id)}
                  className={`text-left px-3 py-2 rounded-lg text-sm md:text-base font-medium transition ${
                    activeSet === tab.id
                      ? "bg-[#5b4a3e] text-white shadow"
                      : "hover:bg-black/5 text-[#5b4a3e]" // ✅ แก้ hover:bg:black/5 -> hover:bg-black/5
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Content area */}
        <main className="lg:col-span-3">
          {loading ? (
            <div className="py-16 text-center">{t("status.loading", "กำลังโหลด…")}</div>
          ) : err ? (
            <div className="py-16 text-center text-red-600">{err}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              {t("status.noResults", "ไม่พบหนังสือที่ตรงกับเงื่อนไข")}
            </div>
          ) : activeSet === "all" ? (
            <div className="space-y-12">
              {Object.entries(groupedBySet)
                .filter(([key]) => key !== "_none")
                .map(([key, group]) => (
                  <section key={key}>
                    <ShelfTitle>{setLabels[key] || `${t("books.collection", "คอลเลกชัน")} #${key}`}</ShelfTitle>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-3">
                      {group.map((it) => (
                        <BookCard key={it["o:id"]} item={it} onOpen={openBook} />
                      ))}
                    </div>
                    <ShelfBar />
                  </section>
                ))}
              {groupedBySet["_none"] && (
                <section>
                  <ShelfTitle>{t("books.uncategorized", "ไม่ระบุหมวด")}</ShelfTitle>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-3">
                    {groupedBySet["_none"].map((it) => (
                      <BookCard key={it["o:id"]} item={it} onOpen={openBook} />
                    ))}
                  </div>
                  <ShelfBar />
                </section>
              )}
            </div>
          ) : (
            <section className="space-y-4">
              <ShelfTitle>
                {setLabels[String(activeSet)] || t("books.collection", "คอลเลกชัน")}
              </ShelfTitle>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-3">
                {singleShelfItems.map((it) => (
                  <BookCard key={it["o:id"]} item={it} onOpen={openBook} />
                ))}
              </div>
              <ShelfBar />
            </section>
          )}
        </main>
      </div>

      <BackToTop />
      <Footer />
    </div>
  );
}
