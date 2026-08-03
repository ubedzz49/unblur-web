"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_LOCALE, findLocale, RTL_LOCALES } from "./locales";
import { DICTIONARIES, TranslationKey } from "./dictionaries";

const LOCALE_STORAGE_KEY = "unblur:locale";

interface I18nContextValue {
  localeCode: string;
  t: (key: TranslationKey) => string;
  setLocale: (code: string) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function loadLocaleCode(): string {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  return window.localStorage.getItem(LOCALE_STORAGE_KEY) ?? DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [localeCode, setLocaleCode] = useState(() => loadLocaleCode());

  useEffect(() => {
    document.documentElement.lang = localeCode;
    document.documentElement.dir = RTL_LOCALES.has(localeCode) ? "rtl" : "ltr";
  }, [localeCode]);

  function setLocale(code: string) {
    const locale = findLocale(code);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale.code);
    setLocaleCode(locale.code);
  }

  function t(key: TranslationKey): string {
    const dict = DICTIONARIES[localeCode] ?? DICTIONARIES[DEFAULT_LOCALE];
    return dict[key] ?? DICTIONARIES[DEFAULT_LOCALE][key] ?? key;
  }

  return <I18nContext.Provider value={{ localeCode, t, setLocale }}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}
