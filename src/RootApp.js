// src/RootApp.js
import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// side-effect init i18n (อย่าใส่วงเล็บปีกกา)
import "./i18n/index.js";

// ✅ default import จากไฟล์ที่ export default
import SettingsProvider from "./context/SettingsContext.jsx";

import HomePage from "./pages/HomePage.jsx";
import BooksPage from "./pages/BooksPage.js";
import BookArticlesPage from "./pages/BookArticlesPage.jsx";
import BookArticleDetail from "./pages/BookArticleDetail.jsx";
import ReaderPage from "./pages/ReaderPage.jsx";

export default function RootApp() {
  return (
    <SettingsProvider>
      <Suspense fallback={<div className="p-6 text-center text-gray-600">Loading…</div>}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/books" element={<BooksPage />} />
            <Route path="/read/:id" element={<ReaderPage />} />
            <Route path="/articles" element={<BookArticlesPage />} />
            <Route path="/book/:id" element={<BookArticleDetail />} />
          </Routes>
        </BrowserRouter>
      </Suspense>
    </SettingsProvider>
  );
}
