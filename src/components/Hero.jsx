// src/components/Hero.jsx
import React, { useEffect, useState } from "react";

export default function Hero({ query, setQuery, onSearch }) {
  const slides = [
    { img: "/assets/hero.jpg" },
    { img: "/assets/hero2.jpeg" },
    { img: "/assets/hero3.jpg" },
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  const current = slides[index];

  return (
    <section className="relative w-full h-[520px] md:h-[620px] overflow-hidden">
      <img src={current.img} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="relative z-10 h-full flex items-center justify-center px-4">
        <div className="max-w-4xl w-full text-center rounded-2xl shadow-lg p-6 md:p-10">
          <form
            className="mt-6 flex w-full max-w-xl mx-auto"
            onSubmit={(e) => { e.preventDefault(); onSearch?.(); }}
          >
            <input
              className="flex-1 h-12 md:h-14 px-4 rounded-l-lg border border-gray-300 focus:outline-none"
              placeholder="ค้นหาหนังสือ บทความ หรือคอลเลกชัน..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="ค้นหา"
            />
            <button type="submit" className="px-5 rounded-r-lg bg-accent text-white font-bold">
              Search
            </button>
          </form>
        </div>

        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${i === index ? "bg-accent scale-110" : "bg-white/60"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
