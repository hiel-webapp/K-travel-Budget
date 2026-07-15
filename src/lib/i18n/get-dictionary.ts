import type { Locale } from "./locales";
import type { Dictionary } from "./dictionaries/ko";

const dictionaries = {
  ko: () => import("./dictionaries/ko").then((module) => module.ko),
  en: () => import("./dictionaries/en").then((module) => module.en),
};

export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  const loadDictionary = dictionaries[locale] || dictionaries.ko;
  return loadDictionary();
};
