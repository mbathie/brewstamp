import en from "./en";
import es from "./es";
import fr from "./fr";
import de from "./de";
import pt from "./pt";
import it from "./it";
import zh from "./zh";
import ja from "./ja";
import ko from "./ko";
import ar from "./ar";
import hi from "./hi";
import id from "./id";
import fil from "./fil";
import tr from "./tr";

// Order: English first (canonical default), then alphabetical by English name.
export const SUPPORTED_LANGUAGES = [
  "en",
  "ar",
  "fil",
  "fr",
  "de",
  "hi",
  "id",
  "it",
  "ja",
  "ko",
  "zh",
  "pt",
  "tr",
  "es",
] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export interface LanguageMeta {
  code: Language;
  englishName: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
}

export const LANGUAGE_META: Record<Language, LanguageMeta> = {
  en: { code: "en", englishName: "English", nativeName: "English", flag: "🇺🇸" },
  es: { code: "es", englishName: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  fr: { code: "fr", englishName: "French", nativeName: "Français", flag: "🇫🇷" },
  de: { code: "de", englishName: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  pt: { code: "pt", englishName: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  it: { code: "it", englishName: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  zh: { code: "zh", englishName: "Mandarin Chinese", nativeName: "中文", flag: "🇨🇳" },
  ja: { code: "ja", englishName: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  ko: { code: "ko", englishName: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  ar: { code: "ar", englishName: "Arabic", nativeName: "العربية", flag: "🇸🇦", rtl: true },
  hi: { code: "hi", englishName: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  id: { code: "id", englishName: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  fil: { code: "fil", englishName: "Filipino", nativeName: "Filipino", flag: "🇵🇭" },
  tr: { code: "tr", englishName: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
};

export type TranslationKey = keyof typeof en;

const dictionaries: Record<Language, Record<string, string>> = {
  en,
  es,
  fr,
  de,
  pt,
  it,
  zh,
  ja,
  ko,
  ar,
  hi,
  id,
  fil,
  tr,
};

export function isLanguage(code: string | undefined | null): code is Language {
  return !!code && (SUPPORTED_LANGUAGES as readonly string[]).includes(code);
}

export function resolveLanguage(code: string | undefined | null): Language {
  return isLanguage(code) ? code : "en";
}

/**
 * Translate a key for the given language, with optional `{name}` parameter substitution.
 * Falls back to English if the key is missing in the target language.
 */
export function t(
  lang: Language | string | undefined | null,
  key: TranslationKey,
  params: Record<string, string | number> = {}
): string {
  const resolved = resolveLanguage(lang);
  const dict = dictionaries[resolved];
  let str = dict[key] ?? dictionaries.en[key] ?? String(key);
  for (const [k, v] of Object.entries(params)) {
    // Use a replacement FUNCTION, not a string: a string replacement treats `$`
    // sequences ($&, $1, …) in the value as patterns, corrupting names/shops
    // like "Bob's $2 Brews" that flow into wallet passes.
    str = str.replace(new RegExp(`\\{${k}\\}`, "g"), () => String(v));
  }
  return str;
}
