import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import BooksPage from "./pages/BooksPage";
import BookArticlesPage from "./pages/BookArticlesPage";
import BookArticleDetail from "./pages/BookArticleDetail";
import ReaderPage from "./pages/ReaderPage"; // ✅ หน้าอ่านใหม่

export default function RootApp() {
  return (
    <BrowserRouter>
      <Routes>
        {/* หน้าแรก */}
        <Route path="/" element={<HomePage />} />

        {/* แคตตาล็อกหนังสือ */}
        <Route path="/books" element={<BooksPage />} />

        {/* หน้าอ่าน PDF แบบใหม่ */}
        <Route path="/read/:id" element={<ReaderPage />} />

        {/* หน้าบทความ */}
        <Route path="/articles" element={<BookArticlesPage />} />
        <Route path="/book/:id" element={<BookArticleDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
