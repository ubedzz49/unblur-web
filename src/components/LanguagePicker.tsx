"use client";

import { LOCALES } from "@/lib/i18n/locales";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import styles from "./LanguagePicker.module.css";

export function LanguagePicker() {
  const { localeCode, setLocale } = useTranslation();

  return (
    <div className={styles.grid}>
      {LOCALES.map((locale) => (
        <button
          key={locale.code}
          type="button"
          onClick={() => setLocale(locale.code)}
          aria-pressed={locale.code === localeCode}
          className={cn(styles.item, locale.code === localeCode && styles.itemActive)}
        >
          <span className={styles.native}>{locale.nativeName}</span>
          <span className={styles.english}>{locale.englishName}</span>
        </button>
      ))}
    </div>
  );
}
