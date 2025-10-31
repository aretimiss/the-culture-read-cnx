// src/pages/BooksPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

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
import { titleOf, descOf } from "../lib/textOf"; // ใช้ fallback เดิมเป็นสำรอง
import { pickLang } from "../lib/i18nPick";

/* ---------- helpers: เลือกภาษาที่ “เข้มงวดกว่า” ---------- */
const variantsFor = (lang) => {
  const L = (lang || "").toLowerCase();
  // แผนที่ภาษาที่เจอบ่อย (เพิ่มได้ตามที่คุณใช้ใน Omeka)
  const map = {
    th: ["th", "tha", "th-th"],
    en: ["en", "eng", "en-us", "en-gb"],
    lo: ["lo", "lao", "lo-la"],
    tl: ["tl", "tgl", "fil", "fil-ph"],
    zh: ["zh", "zho", "zh-cn", "zh-hans", "zh-tw", "zh-hant"],
  };
  // ถ้าไม่อยู่ใน map ให้ลอง [lang, lang-lang]
  const generic = [L, `${L}-${L}`];
  return map[L] || generic;
};

const pickLangStrict = (multilangField, lang) => {
  // multilangField ควรเป็น array ของ { "@value": "...", "@language": "en" }
  if (!Array.isArray(multilangField)) return "";
  const prefs = variantsFor(lang);
  // 1) exact match ตามลำดับความชอบ
  for (const p of prefs) {
    const hit = multilangField.find(
      (x) => (x?.["@language"] || "").toLowerCase() === p
    );
    if (hit?.["@value"]) return hit["@value"];
  }
  // 2) กวาดหาโค้ดภาษาที่ขึ้นต้นเหมือนกัน (เช่น en-* )
  const base = (lang || "").toLowerCase();
  const loose = multilangField.find((x) =>
    (x?.["@language"] || "").toLowerCase().startsWith(base)
  );
  if (loose?.["@value"]) return loose["@value"];

  // 3) ถ้าไม่เจอเลย ค่อย fallback ตัวแรก
  return multilangField[0]?.["@value"] || "";
};

/* ---------- UI ช่วย ๆ ---------- */
const ShelfBar = () => (
  <div className="h-3 rounded-full bg-gradient-to-b from-[#e7d8c9] to-[#d9c1a9] shadow-inner" />
);

const ShelfTitle = ({ children }) => (
  <h2 className="text-xl md:text-2xl font-extrabold tracking-wide text-[#5b4a3e] mb-3">
    {children}
  </h2>
);

/* ===== Skeleton Loader ===== */
const SkeletonLibrary = () => (
  <div className="py-20 flex flex-col items-center gap-6 animate-pulse text-[#5b4a3e]">
    <div className="h-8 w-52 bg-[#e5d7ca]/50 rounded-full" />
    <div className="h-6 w-72 bg-[#e5d7ca]/40 rounded-full" />
    <div className="h-6 w-64 bg-[#e5d7ca]/30 rounded-full" />
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-10 px-4 w-full max-w-6xl">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-[3/4] bg-[#e5d7ca]/40 rounded-xl shadow-sm" />
      ))}
    </div>
  </div>
);

export default function BooksPage() {
  const { t, i18n } = useTranslation();

  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [activeSet, setActiveSet] = useState("all");
  const [setLabels, setSetLabels] = useState({});

  const navigate = useNavigate();

  /* 1) โหลดรายการหนังสือ (เมื่อภาษาเปลี่ยน) */
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
    // เราต้องการให้รอบโหลดนี้เกิดเมื่อภาษาเปลี่ยน เพื่อเคลียร์ state/transition ให้ครบ
  }, [i18n.language, t]);

  /* 2) โหลด label ของคอลเลกชันตามภาษา (เข้มงวดเหมือนกัน) */
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
              const strict = pickLangStrict(r?.["dcterms:title"], i18n.language);
              const name = strict || r?.["o:title"] || `Collection #${id}`;
              return [String(id), name];
            } catch {
              return [String(id), `Collection #${id}`];
            }
          })
        );
        setSetLabels(Object.fromEntries(pairs));
      } catch {
        // ignore
      }
    })();
  }, [items, i18n.language]);

  /* Tabs หมวดหมู่ */
  const categoryTabs = useMemo(() => {
    const tabs = [{ id: "all", label: t("filters.all", "ทั้งหมด") }];
    const others = Object.entries(setLabels).map(([id, label]) => ({ id, label }));
    return tabs.concat(others);
  }, [setLabels, t]);

  /* สร้างฟังก์ชันคืนค่าชื่อ/คำโปรยตามภาษาแบบเข้มงวด */
  const displayTitle = (it) =>
    pickLangStrict(it?.["dcterms:title"], i18n.language) ||
    titleOf(it); // fallback เดิม

  const displayDesc = (it) =>
    pickLangStrict(it?.["dcterms:description"], i18n.language) ||
    descOf(it) ||
    "";

  /* Filter รายการ — ค้นจากค่าตามภาษาปัจจุบันจริง ๆ */
  const filtered = useMemo(() => {
  const q = query.trim().toLowerCase();
  return items.filter((it) => {
    // ✅ ดึงชื่อ/คำโปรยตามภาษาปัจจุบัน
    const title = (displayTitle(it) || "").toLowerCase();
    const desc = (displayDesc(it) || "").toLowerCase();

    const hit = !q || title.includes(q) || desc.includes(q);
    if (!hit) return false;

    // ✅ กรองหมวดหมู่ (คอลเลกชัน)
    if (activeSet === "all") return true;
    const sets = Array.isArray(it?.["o:item_set"]) ? it["o:item_set"] : [];
    return sets.some((s) => String(s?.["o:id"]) === String(activeSet));
  });
}, [items, query, activeSet, i18n.language]);


  /* จัดกลุ่มชั้นวาง */
  const groupedBySet = useMemo(() => {
    if (activeSet !== "all") return {};
    const groups = {};
    filtered.forEach((it) => {
      const sets = Array.isArray(it?.["o:item_set"]) ? it["o:item_set"] : [];
      if (sets.length === 0) (groups["_none"] ||= []).push(it);
      else {
        sets.forEach((s) => {
          const key = String(s?.["o:id"] || "_none");
          (groups[key] ||= []).push(it);
        });
      }
    });
    return groups;
  }, [filtered, activeSet]);

  const singleShelfItems = useMemo(() => {
    if (activeSet === "all") return [];
    return filtered;
  }, [filtered, activeSet]);

  const openBook = (item) => {
    const id = item?.["o:id"];
    if (!id) return alert(t("errors.noId", "ไม่พบรหัสรายการ"));
    navigate(`/read/${id}`);
  };

  /* ==== UI ==== */
  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#111518]">
      <SiteHeader />

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SkeletonLibrary />
          </motion.div>
        ) : (
          <motion.div
            key={i18n.language} // บังคับ re-render UI ทั้งบล็อคเมื่อภาษาเปลี่ยน
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
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
                            : "hover:bg-black/5 text-[#5b4a3e]"
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
                {err ? (
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
                          <ShelfTitle>
                            {setLabels[key] || `${t("books.collection", "คอลเลกชัน")} #${key}`}
                          </ShelfTitle>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-3">
                            {group.map((it) => (
                              <BookCard
                                key={it["o:id"]}
                                item={it}
                                onOpen={openBook}
                                /* ส่งชื่อ/คำโปรยที่เลือกตามภาษาแบบเข้มงวดเข้าไป */
                                titleOverride={displayTitle(it)}
                                descOverride={displayDesc(it)}
                              />
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
                            <BookCard
                              key={it["o:id"]}
                              item={it}
                              onOpen={openBook}
                              titleOverride={displayTitle(it)}
                              descOverride={displayDesc(it)}
                            />
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
                        <BookCard
                          key={it["o:id"]}
                          item={it}
                          onOpen={openBook}
                          titleOverride={displayTitle(it)}
                          descOverride={displayDesc(it)}
                        />
                      ))}
                    </div>
                    <ShelfBar />
                  </section>
                )}
              </main>
            </div>

            <BackToTop />
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
