// src/pages/BooksPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import BackToTop from "../components/BackToTop";
import BookCard from "../components/BookCard";
import {
  fetchItemsLite,
  titleOf,
  descOf,
  fetchJsonWithProxies,
  withKeys,
  api,
} from "../lib/omekaClient";

const ShelfBar = () => (
  <div className="h-3 rounded-full bg-gradient-to-b from-[#e7d8c9] to-[#d9c1a9] shadow-inner" />
);

const ShelfTitle = ({ children }) => (
  <h2 className="text-xl md:text-2xl font-extrabold tracking-wide text-[#5b4a3e] mb-3">
    {children}
  </h2>
);

export default function BooksPage() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeSet, setActiveSet] = useState("all");
  const [setLabels, setSetLabels] = useState({});
  const navigate = useNavigate(); // ✅ ใช้สำหรับไปหน้าอ่าน

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchItemsLite({ limit: 60, sortBy: "created", sortOrder: "desc" });
        const arr = Array.isArray(data) ? data : [];
        setItems(arr);

        const ids = Array.from(
          new Set(
            arr.flatMap((it) =>
              (Array.isArray(it?.["o:item_set"]) ? it["o:item_set"] : [])
                .map((s) => s?.["o:id"])
                .filter(Boolean)
            )
          )
        );

        if (ids.length) {
          const pairs = await Promise.all(
            ids.map(async (id) => {
              try {
                const r = await fetchJsonWithProxies(withKeys(api(`/item_sets/${id}`)));
                const name = r?.["o:title"] || r?.["dcterms:title"]?.[0]?.["@value"] || `Collection #${id}`;
                return [String(id), name];
              } catch {
                return [String(id), `Collection #${id}`];
              }
            })
          );
          setSetLabels(Object.fromEntries(pairs));
        }
      } catch (e) {
        setErr(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categoryTabs = useMemo(() => {
    const tabs = [{ id: "all", label: "ทั้งหมด" }];
    const others = Object.entries(setLabels).map(([id, label]) => ({ id, label }));
    return tabs.concat(others);
  }, [setLabels]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const t = (titleOf(it) || "").toLowerCase();
      const d = (descOf(it) || "").toLowerCase();
      const hit = !q || t.includes(q) || d.includes(q);
      if (!hit) return false;
      if (activeSet === "all") return true;
      const sets = Array.isArray(it?.["o:item_set"]) ? it["o:item_set"] : [];
      return sets.some((s) => String(s?.["o:id"]) === String(activeSet));
    });
  }, [items, query, activeSet]);

  const groupedBySet = useMemo(() => {
    if (activeSet !== "all") return {};
    const groups = {};
    filtered.forEach((it) => {
      const sets = Array.isArray(it?.["o:item_set"]) ? it["o:item_set"] : [];
      if (sets.length === 0) {
        groups["_none"] ||= [];
        groups["_none"].push(it);
      } else {
        sets.forEach((s) => {
          const key = String(s?.["o:id"] || "_none");
          groups[key] ||= [];
          groups[key].push(it);
        });
      }
    });
    return groups;
  }, [filtered, activeSet]);

  const singleShelfItems = useMemo(() => {
    if (activeSet === "all") return [];
    return filtered;
  }, [filtered, activeSet]);

  // ✅ ฟังก์ชันเปิดอ่าน → ไปหน้า /read/:id
  const openBook = (item) => {
    const id = item?.["o:id"];
    if (!id) return alert("ไม่พบรหัสรายการ");
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
            ห้องสมุด
          </h1>
          <p className="mt-3 max-w-2xl text-[#5b4a3e]/80">
            ค้นหาและเลือกดูหนังสือจากคอลเลกชันต่าง ๆ
          </p>

          <div className="mt-6 w-full max-w-xl">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex items-center rounded-2xl bg-white/90 ring-1 ring-black/10 shadow"
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาชื่อหนังสือ / คำสำคัญ..."
                className="flex-1 px-4 py-3 rounded-2xl bg-transparent outline-none"
              />
              <button className="px-5 py-3 font-semibold">ค้นหา</button>
            </form>
          </div>
        </div>
      </section>

      {/* Layout: Sidebar + Shelf */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-28 space-y-3 p-4 bg-white/70 backdrop-blur-md rounded-2xl shadow ring-1 ring-black/10">
            <h3 className="font-bold text-[#5b4a3e] mb-2">หมวดหมู่</h3>
            <div className="flex flex-col gap-2">
              {categoryTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSet(tab.id)}
                  className={`text-left px-3 py-2 rounded-lg text-sm md:text-base font-medium transition ${
                    activeSet === tab.id
                      ? "bg-[#5b4a3e] text-white shadow"
                      : "hover:bg:black/5 text-[#5b4a3e]"
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
            <div className="py-16 text-center">กำลังโหลด…</div>
          ) : err ? (
            <div className="py-16 text-center text-red-600">{err}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">ไม่พบหนังสือที่ตรงกับเงื่อนไข</div>
          ) : activeSet === "all" ? (
            <div className="space-y-12">
              {Object.entries(groupedBySet)
                .filter(([key]) => key !== "_none")
                .map(([key, group]) => (
                  <section key={key}>
                    <ShelfTitle>{setLabels[key] || `คอลเลกชัน #${key}`}</ShelfTitle>
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
                  <ShelfTitle>ไม่ระบุหมวด</ShelfTitle>
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
              <ShelfTitle>{setLabels[String(activeSet)] || "คอลเลกชัน"}</ShelfTitle>
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
