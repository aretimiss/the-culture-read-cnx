import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const panelRef = useRef(null);

  // ปิดเมนูเมื่อเปลี่ยน route หรือกด Esc / คลิกรอบนอก (กันค้าง)
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    const onPointerDownOutside = (e) => {
      // ถ้าคลิก/แตะนอกแผง ให้ปิด (แต่ไม่ปิดเมื่อคลิกปุ่มแฮมเบอร์เกอร์)
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        if (!e.target.closest("#hamburger-btn")) setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDownOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDownOutside);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full z-50 text-white">
      {/* แถบหัว */}
      <div className="relative bg-gradient-to-b from-[#5b4a3e]/80 to-[#5b4a3e]/40 backdrop-blur-lg shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 sm:px-10 py-5 md:py-6">
          <div className="flex items-center gap-4 md:gap-6">
            <img
              src="/assets/logo.png"
              alt="Logo"
              className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/85 p-2 shadow-lg ring-1 ring-white/30"
            />
            <h1 className="text-lg md:text-2xl font-bold tracking-wide drop-shadow-sm">
              The Culture Read @CNX
            </h1>
          </div>

          {/* เมนูจอใหญ่ */}
          <nav className="hidden md:flex items-center gap-9">
            <Link className="navlink" to="/">หน้าหลัก</Link>
            <Link className="navlink" to="/books">หนังสือ</Link>
            <Link className="navlink" to="/articles">บทความ</Link>
            <Link className="navlink" to="/events">กิจกรรม</Link>
            <Link className="navlink" to="/about">เกี่ยวกับโครงการ</Link>
          </nav>

          {/* ปุ่มแฮมเบอร์เกอร์ (มือถือ) */}
          <button
            id="hamburger-btn"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-3 rounded-lg hover:bg-white/20 transition"
          >
            <span className="material-symbols-outlined text-white text-3xl">
              {menuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>

        {/* แผงเมนูมือถือ: วาง absolute ใต้แถบหัวเสมอ */}
        <div
          id="mobile-nav"
          ref={panelRef}
          className={[
            "md:hidden absolute left-0 top-full w-full origin-top",
            "bg-[#5b4a3e]/95 backdrop-blur-md border-t border-white/20",
            "transition-[transform,opacity] duration-200 ease-out",
            menuOpen ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0 pointer-events-none",
          ].join(" ")}
        >
          <nav className="flex flex-col items-start px-8 py-4 gap-4 text-lg">
            <Link className="navlink" to="/" onClick={() => setMenuOpen(false)}>หน้าหลัก</Link>
            <Link className="navlink" to="/books" onClick={() => setMenuOpen(false)}>หนังสือ</Link>
            <Link className="navlink" to="/articles" onClick={() => setMenuOpen(false)}>บทความ</Link>
            <Link className="navlink" to="/events" onClick={() => setMenuOpen(false)}>กิจกรรม</Link>
            <Link className="navlink" to="/about" onClick={() => setMenuOpen(false)}>เกี่ยวกับโครงการ</Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
