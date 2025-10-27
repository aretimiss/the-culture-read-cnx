import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import BackToTop from "../components/BackToTop";
import {
  api,
  fetchJsonWithProxies,
  titleOf,
  descOf,
  openPDFOf,
} from "../lib/omekaClient";

/** Helper: safe getter for DC fields */
const getVal = (item, key) => item?.[key]?.[0]?.["@value"] || "-";

export default function BookArticleDetail() {
  const { id } = useParams(); // /book/:id
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        setErr("");
        const url = api(`/items/${id}`);
        const data = await fetchJsonWithProxies(url);
        if (!alive) return;
        setItem(data);
        // set document title
        const t = titleOf(data) || data?.["o:title"] || "บทความ";
        document.title = `${t} · บทความแนะนำหนังสือ`;
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [id]);

  const meta = useMemo(() => {
    if (!item) return {};
    return {
      title: titleOf(item) || item?.["o:title"],
      description: descOf(item),
      creator: getVal(item, "dcterms:creator"),
      date: getVal(item, "dcterms:date"),
      extent: getVal(item, "dcterms:extent"),
      identifier: getVal(item, "dcterms:identifier"),
      type: getVal(item, "dcterms:type"),
      thumb: item?.thumbnail_display_urls?.large || "/assets/placeholder.webp",
    };
  }, [item]);

  const handleRead = async () => {
    try {
      await openPDFOf(item);
    } catch (e) {
      alert(e?.message || "เปิดไฟล์ไม่สำเร็จ");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#faf7f2]">
        <SiteHeader />
        <div className="flex-1 max-w-5xl mx-auto w-full p-6 animate-pulse">
          <div className="h-8 w-2/3 bg-[#e7d8c9] rounded mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 h-80 bg-[#efe4d9] rounded" />
            <div className="md:col-span-2 space-y-3">
              <div className="h-5 bg-[#efe4d9] rounded" />
              <div className="h-5 bg-[#efe4d9] rounded w-5/6" />
              <div className="h-5 bg-[#efe4d9] rounded w-4/6" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (err || !item) {
    return (
      <div className="min-h-screen flex flex-col bg-[#faf7f2]">
        <SiteHeader />
        <main className="flex-1 max-w-5xl mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold text-red-700 mb-3">เกิดข้อผิดพลาด</h1>
          <p className="text-gray-600">{err || "ไม่พบข้อมูล"}</p>
          <div className="mt-6">
            <Link to="/articles" className="underline text-[#d8653b]">ย้อนกลับไปหน้ารวมบทความ</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#111518]">
      <SiteHeader />
      <main className="max-w-6xl mx-auto p-6">
        {/* Breadcrumb */}
        <nav className="text-sm mb-4 text-[#7b6c61]">
          <Link to="/" className="hover:underline">หน้าแรก</Link>
          <span className="mx-2">/</span>
          <Link to="/articles" className="hover:underline">บทความแนะนำหนังสือ</Link>
          <span className="mx-2">/</span>
          <span className="text-[#5b4a3e]">{meta.title}</span>
        </nav>

        {/* Header section */}
        <header className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border border-[#e7d8c9] rounded-2xl shadow p-4">
          <img
            src={meta.thumb}
            alt={meta.title}
            className="w-full h-80 object-cover rounded-xl"
          />
          <div className="md:col-span-2 flex flex-col">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#5b4a3e] mb-3">
              {meta.title}
            </h1>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-[#57493f]">
              <li><span className="opacity-70">ผู้แต่ง:</span> {meta.creator}</li>
              <li><span className="opacity-70">ปี/วันที่:</span> {meta.date}</li>
              <li><span className="opacity-70">จำนวนหน้า:</span> {meta.extent}</li>
              <li><span className="opacity-70">เลขทะเบียน:</span> {meta.identifier}</li>
              <li><span className="opacity-70">ประเภท:</span> {meta.type}</li>
            </ul>
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleRead}
                className="px-5 py-2 rounded-lg bg-[#d8653b] text-white shadow hover:opacity-90"
              >
                อ่าน E‑Book
              </button>
              <a
                href={`https://ebookcnx.com/omekas/s/item/${id}`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2 rounded-lg bg-white border border-[#e7d8c9] shadow hover:bg-[#fff7ee]"
              >
                เปิดใน Omeka S
              </a>
            </div>
          </div>
        </header>

        {/* Article body */}
        <article className="mt-6 bg-white border border-[#e7d8c9] rounded-2xl shadow p-6 leading-8 text-[#3f342d]">
          {meta.description ? (
            <p className="whitespace-pre-wrap">{meta.description}</p>
          ) : (
            <p className="italic text-[#7b6c61]">ยังไม่มีคำอธิบายสำหรับรายการนี้</p>
          )}
        </article>

        {/* Related (simple): show 3 latest other articles */}
        <RelatedArticles currentId={id} />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}

// --- Simple related list using fetchItemsLite ---
function RelatedArticles({ currentId }) {
  const [list, setList] = useState([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const url = api(`/items?resource_class_label=Book&sort_by=created&sort_order=desc`);
        const data = await fetchJsonWithProxies(url);
        const filtered = (Array.isArray(data) ? data : [])
          .filter((it) => it?.["dcterms:description"]?.length > 0 && String(it?.["o:id"]) !== String(currentId))
          .slice(0, 3);
        if (alive) setList(filtered);
      } catch (e) {
        // ignore
      }
    })();
    return () => { alive = false; };
  }, [currentId]);

  if (!list.length) return null;

  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-[#5b4a3e] mb-3">บทความที่เกี่ยวข้อง</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {list.map((it) => {
          const t = titleOf(it);
          const d = (descOf(it) || "").slice(0, 110) + "…";
          const thumb = it.thumbnail_display_urls?.medium || "/assets/placeholder.webp";
          const id = it["o:id"];
          return (
            <Link
              key={id}
              to={`/book/${id}`}
              className="bg-white border border-[#e7d8c9] rounded-xl overflow-hidden shadow hover:shadow-md transition"
            >
              <img src={thumb} alt={t} className="w-full h-40 object-cover" />
              <div className="p-4">
                <h3 className="font-semibold text-[#5b4a3e] line-clamp-2 mb-2">{t}</h3>
                <p className="text-sm text-[#7b6c61] line-clamp-3">{d}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
