// src/components/Footer.jsx
import React from "react";

export default function Footer() {
  return (



 

    <footer className="bg-white border-t border-gray-200 px-4 sm:px-10 lg:px-40 py-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="flex flex-col gap-4">
          <h3 className="text-[#111518] text-lg font-bold">Culture Read @CNX</h3>
          <p className="text-[#637c88] text-sm">© 2025 Culture Read @CNX. All rights reserved.</p>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold">หัวข้อ 1</h4>
          <a className="text-sm hover:underline" href="/topic/1-1">1.1</a>
          <a className="text-sm hover:underline" href="/topic/1-2">1.2</a>
          <a className="text-sm hover:underline" href="/topic/1-3">1.3</a>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold">หัวข้อ 2</h4>
          <a className="text-sm hover:underline" href="/topic/2-1">2.1</a>
          <a className="text-sm hover:underline" href="/topic/2-2">2.2</a>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold">Developers</h4>
          <a className="text-sm hover:underline" href="/status">API Status</a>
        </div>
    </div>

    </footer>
  );
}
