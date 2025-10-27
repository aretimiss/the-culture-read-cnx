import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

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

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-20 flex items-center justify-between px-5 sm:px-8 lg:px-12">
        {/* โลโก้ซ้าย */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/assets/logo.png"
            alt="Logo"
            className="w-20 h-20 rounded-2xl bg-white/90 p-2 shadow ring-1 ring-black/10"
          />
          <span className="sr-only">Home</span>
        </Link>

        {/* ปุ่ม Hamburger ขวา */}
        <button
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/85 backdrop-blur-md shadow ring-1 ring-black/10 hover:scale-[1.03] transition"
        >
          <div className="space-y-1.5">
            <span className="block w-6 h-0.5 bg-black"></span>
            <span className="block w-6 h-0.5 bg-black"></span>
            <span className="block w-6 h-0.5 bg-black"></span>
          </div>
        </button>
      </header>

      {/* Overlay + Drawer เมนูตัวอักษรใหญ่ */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      <nav
        className={`fixed top-0 right-0 h-full w-[88%] max-w-[420px] z-[70] bg-[#fffaf2] shadow-2xl ring-1 ring-black/10
        transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
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
        <ul className="p-6 space-y-4">
          {[
            { to: "/", label: "Home" },
            { to: "/books", label: "Books" },
            { to: "/articles", label: "Articles" },
            { to: "/about", label: "About" },
          ].map((m) => (
            <li key={m.to}>
              <Link
                to={m.to}
                className="block text-2xl md:text-3xl font-bold tracking-tight hover:translate-x-1 transition"
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
