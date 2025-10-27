import React, { useRef, useEffect, useState } from "react";

export default function ParallaxHero({ banner, onSearch }) {
  const ref = useRef(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    // Parallax แบบเบา ๆ ด้วย translateY ตาม scroll
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const y = window.scrollY;
      el.style.transform = `translateY(${Math.min(y * 0.25, 120)}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative h-[92vh] min-h-[560px] w-full overflow-hidden">
      {/* พื้นหลัง */}
      <div
        className="absolute inset-0 bg-center bg-cover will-change-transform"
        style={{ backgroundImage: `url(${banner})` }}
        ref={ref}
      />
      {/* ฟิล์มอุ่น ๆ ให้เข้ากับธีม */}
      <div className="absolute inset-0 bg-[#fff1e6]/60" />

      {/* เนื้อหากลางจอ */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-wide text-[#5b4a3e] drop-shadow">
          The Culture Read @CNX
        </h1>
        <p className="mt-4 max-w-2xl text-lg md:text-xl text-[#5b4a3e]/80">
          หอสมุดแห่งชาติรัชมังคลาภิเษก เชียงใหม่
        </p>

        {/* search box */}
        <div className="mt-8 w-full max-w-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearch?.(q);
            }}
            className="flex items-center rounded-2xl bg-white/90 ring-1 ring-black/10 shadow"
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search books, authors, keywords…"
              className="flex-1 px-4 py-3 rounded-2xl bg-transparent outline-none"
            />
            <button className="px-5 py-3 font-semibold">Search</button>
          </form>
        </div>
      </div>
    </section>
  );
}
