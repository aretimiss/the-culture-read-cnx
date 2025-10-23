// src/lib/omekaClient.js
import axios from "axios";

/** ====== ENV & URL helpers ====== */
const RAW_BASE = process.env.REACT_APP_API_BASE_URL || "";
const BASE_URL = RAW_BASE.replace(/\/+$/, "");

export const withKeys = (url) => {
  const key_identity = process.env.REACT_APP_API_KEY_IDENTITY;
  const key_credential = process.env.REACT_APP_API_KEY_CREDENTIAL;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}key_identity=${key_identity}&key_credential=${key_credential}`;
};
export const api = (path) =>
  withKeys(`${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);

export const fetchJsonWithProxies = async (finalUrl) => {
  try {
    const viaAllorigins = `https://api.allorigins.win/get?url=${encodeURIComponent(finalUrl)}`;
    const r1 = await axios.get(viaAllorigins, { timeout: 15000 });
    return JSON.parse(r1.data.contents);
  } catch {}
  try {
    const viaCodetabs = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(finalUrl)}`;
    const r2 = await axios.get(viaCodetabs, { timeout: 15000 });
    return r2.data;
  } catch {}
  const r3 = await axios.get(finalUrl, { timeout: 15000 });
  return r3.data;
};

/** ====== Small helpers ====== */
export const titleOf = (item) =>
  item["o:title"] || item["dcterms:title"]?.[0]?.["@value"] || "ไม่มีชื่อเอกสาร";

export const descOf = (item) =>
  item["dcterms:abstract"]?.[0]?.["@value"] ||
  item["dcterms:description"]?.[0]?.["@value"] ||
  "";

export const thumbOf = (item) =>
  item?.thumbnail_display_urls?.large ||
  item?.thumbnail_display_urls?.medium ||
  item?.thumbnail_display_urls?.square ||
  null;

export const createdOf = (item) => {
  const iso = item?.["o:created"]?.["@value"];
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
};

/** เปิด PDF ของรายการ */
export async function openPDFOf(item) {
  const mediaId = item?.["o:primary_media"]?.["o:id"];
  if (!mediaId) throw new Error("ไม่พบไฟล์หลักของรายการนี้");
  const media = await fetchJsonWithProxies(api(`/media/${mediaId}`));
  const url = media?.["o:original_url"];
  if (!url) throw new Error("ไม่พบ URL ของไฟล์ PDF");
  window.open(url, "_blank");
}
