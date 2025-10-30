// src/lib/i18nPick.js
// รับค่า Omeka S ที่เป็น array ของ value objects:
// [{ "@value": "Title TH", "@language": "th" }, { "@value": "Title EN", "@language": "en" }]
// คืนค่าที่ตรงกับภาษาปัจจุบัน, ถ้าไม่มี → ลอง fallback ตามลำดับ, ถ้ายังไม่มี → ตัวแรก

const ALIASES = {
  // map alias → canonical
  th: ["th"],
  en: ["en", "en-US", "en-GB"],
  lo: ["lo"],             // Lao
  fil: ["fil", "tl"],     // Filipino/Tagalog
  zh: ["zh", "zh-CN", "zh-Hans", "zh-Hant", "zh-TW", "zh-HK"],
};

const CANONICAL = {
  th: "th",
  en: "en",
  lo: "lo",
  fil: "fil",
  zh: "zh", // คุณจะเก็บใน Omeka เป็น zh-Hans / zh-Hant ก็ได้ (ดู fallback ด้านล่าง)
};

export function normalizeLang(code = "") {
  const c = String(code).trim();
  if (!c) return "";
  const low = c.toLowerCase();
  // คืน alias group ถ้าพบ
  for (const [canon, al] of Object.entries(ALIASES)) {
    if (al.includes(low)) return canon;
  }
  return low;
}

export function pickLang(values = [], current = "en", options = {}) {
  if (!Array.isArray(values) || values.length === 0) return "";

  const lang = normalizeLang(current) || "en";
  const want = (l) => normalizeLang(l) === lang;

  // 1) ตรงกับภาษาปัจจุบัน
  const hit = values.find((v) => want(v?.["@language"]));
  if (hit?.["@value"]) return hit["@value"];

  // 2) fallback เฉพาะกรณีจีน: ถ้าเลือก zh แล้วไม่มี → ลอง zh-Hans, zh-Hant
  if (lang === "zh") {
    const zhCandidates = ["zh-Hans", "zh-CN", "zh", "zh-Hant", "zh-TW", "zh-HK"];
    const zhHit = values.find((v) => zhCandidates.includes(String(v?.["@language"])));
    if (zhHit?.["@value"]) return zhHit["@value"];
  }

  // 3) ถ้าไม่มีภาษานั้น ให้ fallback เป็นอังกฤษ
  const enHit = values.find((v) => normalizeLang(v?.["@language"]) === "en");
  if (enHit?.["@value"]) return enHit["@value"];

  // 4) ไม่มีก็เลือกตัวแรก
  return values[0]?.["@value"] ?? "";
}
