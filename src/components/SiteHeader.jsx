// src/components/SiteHeader.jsx
import React, { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import LanguageAndTextControls from "./LanguageAndTextControls";

/** ล็อกสกรอลเมื่อ Drawer เปิด */
function useLockBody(lock) {
  useEffect(() => {
    if (!lock) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, [lock]);
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  useLockBody(open);

  // ย่อความสูง/เพิ่มความทึบเวลาเลื่อน (ทำให้ไม่เห็นเป็นแถบยาวทึบ)
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all ${
          scrolled ? "h-16" : "h-20"
        }`}
      >
        <div
          className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 h-full flex items-center justify-between
          rounded-b-2xl transition-all
          ${scrolled
            ? "bg-white/75 backdrop-blur-md shadow-md ring-1 ring-black/10"
            : "bg-white/25 backdrop-blur-md shadow-sm ring-1 ring-black/10"}`
          }
          style={{contain: "paint"}}
        >
          {/* โลโก้ */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/assets/logo.png"
              alt="Logo"
              className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/90 p-2 shadow ring-1 ring-black/10"
            />
            <span className="sr-only">Home</span>
          </Link>

          {/* ฝั่งขวา: ควบคุมภาษา + ปุ่มแฮมเบอร์เกอร์ */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* ควบคุมภาษา/ขนาดอักษร (มีอยู่แล้วในโปรเจกต์) */}
            <div className="hidden xs:block">
              <LanguageAndTextControls />
            </div>

            {/* ปุ่มแฮมเบอร์เกอร์ — แสดงทุกขนาดจอ */}
            <button
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/90 backdrop-blur-md
                         shadow ring-1 ring-black/10 hover:scale-[1.03] active:scale-[0.99] transition"
            >
              <div className="space-y-1.5">
                <span className="block w-6 h-0.5 bg-black"></span>
                <span className="block w-6 h-0.5 bg-black"></span>
                <span className="block w-6 h-0.5 bg-black"></span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Spacer ป้องกันคอนเทนต์โดนทับ */}
      <div className={`${/* ให้สูงเท่าหัวเว็บแบบ dynamic */""} ${"h-20 md:h-20"}`} />

      {/* Overlay เมื่อเมนูเปิด */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Drawer เมนูตัวอักษรใหญ่ */}
      <nav
        className={`fixed top-0 right-0 h-full w-[88%] max-w-[420px] z-[70] bg-[#fffaf2]
                    shadow-2xl ring-1 ring-black/10 transition-transform duration-300 ease-out
                    ${open ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!open}
      >
        <div className="p-6 flex items-center justify-between border-b border-black/10">
          <div className="text-2xl font-extrabold tracking-wide">Menu</div>
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="w-11 h-11 rounded-xl bg-black/80 text-white"
          >
            ✕
          </button>
        </div>

        {/* ส่วนควบคุมภาษาสำหรับมือถือ/ในเมนู */}
        <div className="p-6 border-b border-black/10 md:hidden">
          <LanguageAndTextControls />
        </div>

        <ul className="p-6 space-y-4">
          {[
            { to: "/", label: "Home" },
            { to: "/books", label: "Books" },
            { to: "/articles", label: "Articles" },
          ].map((m) => (
            <li key={m.to}>
              <NavLink
                to={m.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block text-2xl md:text-3xl font-bold tracking-tight transition
                   ${isActive ? "text-[#d8653b]" : "hover:translate-x-1"}`
                }
              >
                {m.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
