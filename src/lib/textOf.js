// src/lib/textOf.js
import i18n from "../i18n";
import { pickLang } from "./i18nPick";

/** Helper: ดึงค่าจากฟิลด์แบบมีภาษาหรือไม่มีก็ได้ */
function valOf(it, key) {
  if (!it) return "";
  const val = pickLang(it[key], i18n.language);
  if (val) return val;

  // fallback: เอาค่าช่องแรกถ้ามี
  if (Array.isArray(it[key]) && it[key][0]?.["@value"]) return it[key][0]["@value"];
  return "";
}

/** Helper: ถ้าไม่มี dcterms:title ใช้ o:title แทน */
export const titleOf = (it) =>
  valOf(it, "dcterms:title") || it?.["o:title"] || "";

/** Description / คำอธิบาย */
export const descOf = (it) => valOf(it, "dcterms:description");

/** Subject / หัวเรื่อง */
export const subjectOf = (it) => valOf(it, "dcterms:subject");

/** Creator / ผู้สร้าง */
export const creatorOf = (it) => valOf(it, "dcterms:creator");

/** Contributor / ผู้ร่วมสร้าง */
export const contributorOf = (it) => valOf(it, "dcterms:contributor");

/** Publisher / สำนักพิมพ์ */
export const publisherOf = (it) => valOf(it, "dcterms:publisher");

/** Date / ปีที่พิมพ์ */
export const dateOf = (it) => valOf(it, "dcterms:date");

/** Type / ประเภทสื่อ */
export const typeOf = (it) => valOf(it, "dcterms:type");

/** Extent / ความยาว เช่น 34 หน้า */
export const extentOf = (it) => valOf(it, "dcterms:extent");

/** Rights / สิทธิ์การใช้งาน */
export const rightsOf = (it) => valOf(it, "dcterms:rights");

/** Identifier / เลขที่เอกสารหรือ URL */
export const identifierOf = (it) => valOf(it, "dcterms:identifier");

/** Format / รูปแบบไฟล์ (PDF, JPG, ฯลฯ) */
export const formatOf = (it) => valOf(it, "dcterms:format");

/** Alternative title */
export const altTitleOf = (it) => valOf(it, "dcterms:alternative");

/** Language code (เช่น th, en, lo, zh) */
export const languageOf = (it) =>
  valOf(it, "dcterms:language") || it?.["dcterms:language"]?.[0]?.["@value"] || "";

/** Thumbnail (มี fallback ครบทุกขนาด) */
export const thumbOf = (it) =>
  it?.thumbnail_display_urls?.large ||
  it?.thumbnail_display_urls?.medium ||
  it?.thumbnail_display_urls?.square ||
  "/assets/placeholder.webp";

/** รวมค่าทุกฟิลด์เป็น object (ใช้ใน BookDetail, BookCard ฯลฯ ได้เลย) */
export function metaOf(it) {
  return {
    id: it?.["o:id"],
    title: titleOf(it),
    altTitle: altTitleOf(it),
    desc: descOf(it),
    subject: subjectOf(it),
    creator: creatorOf(it),
    contributor: contributorOf(it),
    publisher: publisherOf(it),
    date: dateOf(it),
    type: typeOf(it),
    extent: extentOf(it),
    rights: rightsOf(it),
    identifier: identifierOf(it),
    format: formatOf(it),
    language: languageOf(it),
    thumb: thumbOf(it),
  };
}
