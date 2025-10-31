// src/lib/omekaClient.js
import axios from "axios";

/** ========= ENV (รองรับ Vite/CRA) ========= */
const isVite = typeof import.meta !== "undefined" && import.meta.env;
const RAW_BASE =
  (isVite ? import.meta.env.VITE_API_BASE_URL : process.env.REACT_APP_API_BASE_URL) || "";
const KEY_ID =
  (isVite ? import.meta.env.VITE_API_KEY_IDENTITY : process.env.REACT_APP_API_KEY_IDENTITY) || "";
const KEY_CRED =
  (isVite ? import.meta.env.VITE_API_KEY_CREDENTIAL : process.env.REACT_APP_API_KEY_CREDENTIAL) || "";
const BASE_URL = RAW_BASE.trim().replace(/\/+$/, "");

/** ========= Assert ========= */
function assertEnv() {
  if (!BASE_URL) throw new Error("Missing API base URL (.env)");
  if (!KEY_ID || !KEY_CRED) throw new Error("Missing API keys (.env)");
}

/** ========= URL helpers ========= */
export const api = (path) => {
  assertEnv();
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${clean}`;
};

export const withKeys = (url) => {
  assertEnv();
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}key_identity=${encodeURIComponent(KEY_ID)}&key_credential=${encodeURIComponent(
    KEY_CRED
  )}`;
};

/** ========= Axios instance + lightweight cache ========= */
const http = axios.create({
  timeout: 8000,
  headers: { Accept: "application/json" },
});

// in-memory cache (URL -> { t, data })
const cache = new Map();
const now = () => Date.now();

/** ========= Query-string builder (รองรับ array/object/property[]) ========= */
function buildQuery(obj = {}) {
  const pairs = [];
  const enc = (v) => encodeURIComponent(String(v));

  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;

    if (Array.isArray(v)) {
      v.forEach((val, idx) => {
        if (val && typeof val === "object" && !Array.isArray(val)) {
          Object.entries(val).forEach(([sk, sv]) => {
            if (sv === undefined || sv === null) return;
            pairs.push(`${enc(k)}[${idx}][${enc(sk)}]=${enc(sv)}`);
          });
        } else {
          pairs.push(`${enc(k)}[]=${enc(val)}`);
        }
      });
      return;
    }

    if (typeof v === "object") {
      Object.entries(v).forEach(([sk, sv]) => {
        if (sv === undefined || sv === null) return;
        pairs.push(`${enc(k)}[${enc(sk)}]=${enc(sv)}`);
      });
      return;
    }

    pairs.push(`${enc(k)}=${enc(v)}`);
  });

  return pairs.join("&");
}

/** GET with cache + graceful CORS fallbacks */
async function getJson(url, { cacheTtlMs = 30000 } = {}) {
  const hit = cache.get(url);
  if (hit && now() - hit.t < cacheTtlMs) return hit.data;

  try {
    const r = await http.get(url);
    cache.set(url, { t: now(), data: r.data });
    return r.data;
  } catch (e1) {
    try {
      const via = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const r2 = await http.get(via);
      const data =
        typeof r2.data?.contents === "string" ? JSON.parse(r2.data.contents) : r2.data;
      cache.set(url, { t: now(), data });
      return data;
    } catch (e2) {
      const via2 = `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`;
      const r3 = await http.get(via2);
      cache.set(url, { t: now(), data: r3.data });
      return r3.data;
    }
  }
}

/** ========= Public fetchers (เบา) ========= */
/**
 * ดึง items แบบเบา: จำกัดจำนวน/เรียงลำดับ + กรอง has_media=1
 * รองรับพารามิเตอร์กรองเพิ่ม เช่น resource_class_label, "o:resource_class", item_set_id, property[]
 */
export async function fetchItemsLite({
  limit = 12,
  page = 1,
  sortBy = "created",
  sortOrder = "desc",
  query,
  ...restFilters
} = {}) {
  let base =
    `/items?per_page=${encodeURIComponent(limit)}` +
    `&page=${encodeURIComponent(page)}` +
    `&sort_by=${encodeURIComponent(sortBy)}` +
    `&sort_order=${encodeURIComponent(sortOrder)}` +
    `&has_media=1`;

  if (query && query.trim()) {
    const q = query.trim();
    base += `&${buildQuery({
      property: [
        { property: "dcterms:title", type: "contains", text: q },
        { property: "dcterms:description", type: "contains", text: q },
      ],
    })}`;
  }

  if (restFilters && Object.keys(restFilters).length > 0) {
    base += `&${buildQuery(restFilters)}`;
  }

  const url = withKeys(api(base));
  return await getJson(url, { cacheTtlMs: 30000 });
}

/** อ่าน media ของ item เฉพาะเมื่อจำเป็น (lazy) */
export async function fetchMediaForItem(itemId, { cacheTtlMs = 60000 } = {}) {
  const url = withKeys(api(`/media?item_id=${encodeURIComponent(itemId)}`));
  return await getJson(url, { cacheTtlMs });
}

/** หา URL PDF (ยังคงไว้สำหรับปุ่ม “เปิดอ่าน”) */
export async function pdfUrlOf(item) {
  const medias = Array.isArray(item?.["o:media"]) ? item["o:media"] : [];
  for (const m of medias) {
    const type = m?.["o:media_type"] || "";
    const direct = m?.["o:original_url"] || m?.["o:source"];
    if (type.includes("pdf") && direct) return direct;
  }
  if (medias.length) {
    for (const ref of medias) {
      const refId = ref?.["@id"];
      if (!refId) continue;
      const url = withKeys(refId);
      try {
        const m = await getJson(url, { cacheTtlMs: 60000 });
        const type = m?.["o:media_type"] || "";
        if (type.includes("pdf")) {
          return m?.["o:original_url"] || m?.["o:source"] || null;
        }
      } catch {}
    }
  }
  const id = item?.["o:id"];
  if (!id) return null;
  const list = await fetchMediaForItem(id);
  const pdf = (Array.isArray(list) ? list : []).find((m) =>
    (m?.["o:media_type"] || "").includes("application/pdf")
  );
  return pdf?.["o:original_url"] || pdf?.["o:source"] || null;
}

/** เปิด PDF */
export async function openPDFOf(item) {
  const url = await pdfUrlOf(item);
  if (!url) throw new Error("ไม่พบไฟล์ PDF");
  window.open(url, "_blank", "noopener,noreferrer");
}

/** ========= ตัวช่วยดึงรูปปกจาก API (รองรับ thumbnail_display_urls) ========= */
const thumbCache = new Map();

/**
 * คืน URL ปกของ item:
 * 1) item.thumbnail_display_urls (medium > large > square > original)
 * 2) media ที่ฝังมาและเป็น image + thumbnail_display_urls
 * 3) media เป็น @id → ดึงรายละเอียดก่อนแล้วเลือกเหมาะสุด
 */
export async function thumbUrlOf(item) {
  const itemId = item?.["o:id"];
  if (!itemId) return null;
  if (thumbCache.has(itemId)) return thumbCache.get(itemId);

  // (1) item-level thumbnails
  const itThumb = item?.thumbnail_display_urls;
  if (itThumb) {
    const best =
      itThumb.medium || itThumb.large || itThumb.square || itThumb.original || null;
    if (best) { thumbCache.set(itemId, best); return best; }
  }

  // (2) media ฝังมา
  const medias = Array.isArray(item?.["o:media"]) ? item["o:media"] : [];
  for (const m of medias) {
    const mt = m?.["o:media_type"] || "";
    const t = m?.thumbnail_display_urls;
    if (mt.startsWith("image/") && t) {
      const best = t.medium || t.large || t.square || m?.["o:original_url"] || null;
      if (best) { thumbCache.set(itemId, best); return best; }
    }
  }

  // (3) media เป็นลิงก์ @id → ดึงรายละเอียด
  for (const ref of medias) {
    const refId = ref?.["@id"];
    if (!refId) continue;
    try {
      const m = await getJson(withKeys(refId), { cacheTtlMs: 60000 });
      const mt = m?.["o:media_type"] || "";
      const t = m?.thumbnail_display_urls;
      const best =
        t?.medium ||
        t?.large ||
        t?.square ||
        (mt.startsWith("image/") ? m?.["o:original_url"] : null) ||
        null;
      if (best) { thumbCache.set(itemId, best); return best; }
    } catch {}
  }

  thumbCache.set(itemId, null);
  return null;
}

/** ========= โปรเปอร์ตีทั่วไป ========= */
export const titleOf = (it) =>
  it?.["o:title"] || it?.["dcterms:title"]?.[0]?.["@value"] || `#${it?.["o:id"] || ""}`;

export const descOf = (it) =>
  it?.["dcterms:description"]?.[0]?.["@value"] || "";

/** ========= export fetch แบบเดิมเพื่อความเข้ากันได้ ========= */
export const fetchJsonWithProxies = async (finalUrl) => getJson(finalUrl, { cacheTtlMs: 30000 });
