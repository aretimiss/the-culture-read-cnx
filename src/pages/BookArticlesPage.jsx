import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import BackToTop from "../components/BackToTop";
import {
  fetchItemsLite,
  titleOf,
  descOf,
  openPDFOf,
} from "../lib/omekaClient";

export default function BookArticlesPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItemsLite()
      .then((res) => {
        const filtered = res.filter(
          (item) => item["dcterms:description"] && item["dcterms:description"].length > 0
        );
        setBooks(filtered);
      })
      .catch((err) => console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center text-gray-500">
          กำลังโหลด...
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#111518]">
          <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-[#5b4a3e] mb-8 text-center">
          รวมบทความแนะนำหนังสือหายาก
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => {
            const title = titleOf(book);
            const desc = descOf(book)?.slice(0, 180) + "...";
            const thumb =
              book.thumbnail_display_urls?.medium || "/assets/placeholder.webp";

            return (
              <Link
                to={`/book/${book["o:id"]}`}
                key={book["o:id"]}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition duration-300 border border-[#e7d8c9] flex flex-col"
              >
                <img
                  src={thumb}
                  alt={title}
                  className="w-full h-64 object-cover"
                />
                <div className="p-5 flex flex-col flex-grow">
                  <h2 className="text-lg font-semibold text-[#5b4a3e] mb-2">
                    {title}
                  </h2>
                  <p className="text-sm text-[#7b6c61] flex-grow">{desc}</p>
                  <div className="mt-4 text-right">
                    <span className="inline-block text-[#d8653b] font-medium hover:underline">
                      อ่านต่อ →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}