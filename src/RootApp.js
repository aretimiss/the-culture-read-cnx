import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import BooksPage from "./pages/BooksPage";
import PdfReaderPage from "./pages/PdfReaderPage";

export default function RootApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/read/:mediaId" element={<PdfReaderPage />} />
        <Route path="/read/:id" element={<PdfReaderPage />} />

      </Routes>
    </BrowserRouter>
  );
}
