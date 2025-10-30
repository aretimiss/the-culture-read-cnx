// src/components/SiteHeader.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// ✅ i18n + ตัวคุมภาษา/ขนาดตัวอักษร
import { useTranslation } from "react-i18next";
import LanguageAndTextControls from "./LanguageAndTextControls";

/** ปิดสกรอลเมื่อเมนูเปิด */
function useLockBody(lock) {
  useEffect(() => {
    if (!lock) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = original);
  }, [lock]);
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  useLockBody(open);

  const { t } = useTranslation();

  // เมนูนำทาง ใช้คำแปลจาก i18n
  const navItems = [
    { to: "/", label: t("menu.home") },
    { to: "/books", label: t("menu.books") },
    { to: "/articles", label: t("menu.articles") },
  ];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-20 flex items-center justify-between px-5 sm:px-8 lg:px-12 bg-gradient-to-b from-[#5b4a3e]/80 to-[#5b4a3e]/40 backdrop-blur-md">
        {/* โลโก้ + ไปหน้าแรก */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/assets/logo.png"
            alt="Logo"
            className="w-14 h-14 rounded-2xl bg-white/90 p-2 shadow ring-1 ring-black/10"
          />
          <span className="sr-only">Home</span>
        </Link>

        {/* ✅ คอนโทรล ภาษา + ขนาดตัวอักษร (แสดงบนเดสก์ท็อป/แท็บเล็ต) */}
        <div className="hidden sm:block">
          <LanguageAndTextControls className="flex" />
        </div>

        {/* ปุ่ม Hamburger (มือถือ/แท็บเล็ต) */}
        <button
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="inline-flex sm:hidden items-center justify-center w-12 h-12 rounded-xl bg-white/85 backdrop-blur-md shadow ring-1 ring-black/10 hover:scale-[1.03] transition"
        >
          <div className="space-y-1.5">
            <span className="block w-6 h-0.5 bg-black"></span>
            <span className="block w-6 h-0.5 bg-black"></span>
            <span className="block w-6 h-0.5 bg-black"></span>
          </div>
        </button>
      </header>

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Drawer เมนู (มือถือ/แท็บเล็ต) */}
      <nav
        className={`fixed top-0 right-0 h-full w-[88%] max-w-[420px] z-[70] bg-[#fffaf2] shadow-2xl ring-1 ring-black/10
        transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!open}
      >
        <div className="p-5 flex items-center justify-between border-b border-black/10">
          <div className="text-xl font-extrabold tracking-wide">
            {t("menuLabel", "Menu")}
          </div>
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="w-10 h-10 rounded-xl bg-black/80 text-white"
          >
            ✕
          </button>
        </div>

        {/* ✅ คอนโทรล ภาษา + ขนาดตัวอักษร (แสดงใน Drawer บนมือถือ) */}
        <div className="p-5 border-b border-black/10">
          <LanguageAndTextControls className="flex" />
        </div>

        <ul className="p-5 space-y-4">
          {navItems.map((m) => (
            <li key={m.to}>
              <Link
                to={m.to}
                className="block text-2xl font-bold tracking-tight hover:translate-x-1 transition"
                onClick={() => setOpen(false)}
              >
                {m.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
