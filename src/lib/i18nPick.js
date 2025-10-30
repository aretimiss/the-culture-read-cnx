export const pickLang = (values = [], target = "th") => {
  if (!Array.isArray(values)) return "";
  const low = (s) => (s || "").toLowerCase();
  const get = (lang) =>
    values.find((v) => low(v["@language"] || v["o:lang"]) === low(lang))?.[
      "@value"
    ];
  return get(target) || get("en") || values[0]?.["@value"] || "";
};
