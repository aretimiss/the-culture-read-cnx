// src/components/FilterSidebar.jsx
import React from "react";

export default function FilterSidebar({ filters, selected, onChange }) {
  // filters = { subjects: [...], types: [...], languages: [...], sources: [...] }
  // selected = { subject, type, language, source }

  const renderGroup = (label, key, items) => (
    <div className="mb-6">
      <h3 className="font-semibold bg-[#d8653b] text-white px-3 py-2 rounded-t">{label}</h3>
      <div className="border border-[#d8653b] rounded-b bg-white divide-y divide-[#f2e1d2]">
        {items.map((it) => (
          <button
            key={it.value}
            onClick={() => onChange(key, it.value === selected[key] ? null : it.value)}
            className={`block w-full text-left px-3 py-2 text-sm hover:bg-[#f9e9d9] ${
              it.value === selected[key] ? "bg-[#f3d1b3] font-bold text-[#5b3a2d]" : "text-[#5b3a2d]"
            }`}
          >
            {it.label} <span className="float-right text-xs opacity-60">{it.count}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <aside className="w-full md:w-1/4 lg:w-1/5">
      {renderGroup("หัวเรื่อง", "subject", filters.subjects)}
      {renderGroup("ประเภทเอกสาร", "type", filters.types)}
      {renderGroup("ภาษา", "language", filters.languages)}
      {renderGroup("แหล่งข้อมูล", "source", filters.sources)}
    </aside>
  );
}
