// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#f8f6f3] border-t border-gray-200 px-6 sm:px-10 lg:px-40 py-10 text-[#5b4a3e]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Logo / Project name */}
        <div className="flex flex-col gap-3 md:col-span-2">
          <h3 className="text-xl font-bold text-[#d8653b]">
            {t("footer.title", "Culture Read @CNX")}
          </h3>
          <p className="text-sm leading-relaxed">
            {t(
              "footer.tagline",
              "A collaborative digital library by Thailand–Laos–Philippines to preserve and share cultural heritage through reading."
            )}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <a
              href="https://www.facebook.com/nl.chiangmai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[#3b5998] hover:underline"
              aria-label={t("footer.links.facebook", "Facebook")}
            >
              <Facebook size={16} /> {t("footer.links.facebook", "Facebook")}
            </a>

            <a
              href="https://www.finearts.go.th/chiangmailibrary"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[#7bae6a] hover:text-[#d8653b] transition-colors"
              aria-label={t("footer.links.mainSite", "Main website")}
            >
              <Globe size={16} />
              {t("footer.links.mainSite", "Main website")}
            </a>
          </div>
        </div>

        {/* About */}
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold text-[#111518]">
            {t("footer.sections.about.title", "About")}
          </h4>
          <Link className="text-sm hover:underline" to="/about">
            {t("footer.sections.about.mission", "Mission & Project")}
          </Link>
          <Link className="text-sm hover:underline" to="/partners">
            {t("footer.sections.about.partners", "Library Partners")}
          </Link>
          <Link className="text-sm hover:underline" to="/contact">
            {t("footer.sections.about.contact", "Contact")}
          </Link>
        </div>

        {/* Resources */}
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold text-[#111518]">
            {t("footer.sections.resources.title", "Resources")}
          </h4>
          <Link className="text-sm hover:underline" to="/books">
            {t("footer.sections.resources.allBooks", "All Books")}
          </Link>
          <Link className="text-sm hover:underline" to="/articles">
            {t("footer.sections.resources.articles", "Featured Articles")}
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-gray-300 mt-10 pt-6 text-center text-xs text-gray-500">
        {t(
          "footer.copyright",
          "© {{year}} Culture Read @CNX — A collaborative project with Chiang Mai National Library. All rights reserved."
        ).replace("{{year}}", year)}
      </div>
    </footer>
  );
}
