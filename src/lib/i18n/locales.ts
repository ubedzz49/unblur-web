export interface Locale {
  code: string;
  englishName: string;
  nativeName: string;
}

// Ten languages aimed at the largest global user bases for an education/upskilling
// product: English, Hindi, Spanish, Portuguese, French, German, Japanese,
// Simplified Chinese, Arabic (RTL), Indonesian.
export const LOCALES: Locale[] = [
  { code: "en", englishName: "English", nativeName: "English" },
  { code: "hi", englishName: "Hindi", nativeName: "हिन्दी" },
  { code: "es", englishName: "Spanish", nativeName: "Español" },
  { code: "pt", englishName: "Portuguese", nativeName: "Português" },
  { code: "fr", englishName: "French", nativeName: "Français" },
  { code: "de", englishName: "German", nativeName: "Deutsch" },
  { code: "ja", englishName: "Japanese", nativeName: "日本語" },
  { code: "zh", englishName: "Chinese (Simplified)", nativeName: "简体中文" },
  { code: "ar", englishName: "Arabic", nativeName: "العربية" },
  { code: "id", englishName: "Indonesian", nativeName: "Bahasa Indonesia" },
];

export const DEFAULT_LOCALE = "en";
export const RTL_LOCALES = new Set(["ar"]);

export function findLocale(code: string | null): Locale {
  return LOCALES.find((l) => l.code === code) ?? LOCALES.find((l) => l.code === DEFAULT_LOCALE)!;
}
