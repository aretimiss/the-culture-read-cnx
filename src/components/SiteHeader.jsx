// src/components/SiteHeader.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-b from-[#5b4a3e]/80 to-[#5b4a3e]/40 backdrop-blur-lg text-white shadow-md">
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

        <nav className="hidden md:flex items-center gap-9">
          <Link className="navlink" to="/">หน้าหลัก</Link>
          <Link className="navlink" to="/books">หนังสือ</Link>
          <Link className="navlink" to="/articles">บทความ</Link>
          <Link className="navlink" to="/events">กิจกรรม</Link>
          <Link className="navlink" to="/about">เกี่ยวกับโครงการ</Link>
        </nav>

        <button className="md:hidden p-3 rounded-lg hover:bg-white/20 transition">
          <span className="material-symbols-outlined text-white text-2xl">menu</span>
        </button>
      </div>
    </header>
  );
}
