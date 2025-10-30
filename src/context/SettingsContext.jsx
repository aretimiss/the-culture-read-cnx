// src/context/SettingsContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const SettingsContext = createContext(null);
export const useSettings = () => useContext(SettingsContext);

const SIZE_CLASS = { sm: "fs-sm", md: "fs-md", lg: "fs-lg" };

export default function SettingsProvider({ children }) {
  const [textSize, setTextSize] = useState(() => localStorage.getItem("app.textSize") || "md");

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("fs-sm", "fs-md", "fs-lg");
    html.classList.add(SIZE_CLASS[textSize] || "fs-md");
    localStorage.setItem("app.textSize", textSize);
  }, [textSize]);

  const value = useMemo(() => ({ textSize, setTextSize }), [textSize]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
