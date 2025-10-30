import i18n from "../i18n";
import { pickLang } from "./i18nPick";

export const titleOf   = (it) => pickLang(it?.["dcterms:title"], i18n.language);
export const descOf    = (it) => pickLang(it?.["dcterms:description"], i18n.language);
export const subjectOf = (it) => pickLang(it?.["dcterms:subject"], i18n.language);
export const creatorOf = (it) => pickLang(it?.["dcterms:creator"], i18n.language);
