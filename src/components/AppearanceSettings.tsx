"use client";

import { useState } from "react";
import { loadLayoutPrefs, saveLayoutPrefs, LayoutPrefs } from "@/lib/theme";
import styles from "./AppearanceSettings.module.css";

type ThemeChoice = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "theme";

function loadThemeChoice(): ThemeChoice {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

function applyThemeChoice(choice: ThemeChoice) {
  if (typeof window === "undefined") return;
  if (choice === "system") {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
    const preferredDark = matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", preferredDark ? "dark" : "light");
  } else {
    window.localStorage.setItem(THEME_STORAGE_KEY, choice);
    document.documentElement.setAttribute("data-theme", choice);
  }
}

export function AppearanceSettings() {
  // Lazy initializers, not an effect -- this only ever mounts inside the settings
  // page, itself inside AppShell/AppLayout's hydration gate, so reading
  // localStorage here on first render is safe (same pattern used elsewhere, e.g.
  // AppShell's old layout-preset reader).
  const [theme, setTheme] = useState<ThemeChoice>(() => loadThemeChoice());
  const [layout, setLayout] = useState<LayoutPrefs>(() => loadLayoutPrefs());

  function handleSelectTheme(choice: ThemeChoice) {
    setTheme(choice);
    applyThemeChoice(choice);
  }

  function updateLayout(next: Partial<LayoutPrefs>) {
    const merged = { ...layout, ...next };
    setLayout(merged);
    saveLayoutPrefs(merged);
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>Choose light or dark, or follow your system setting automatically.</p>

      <h3 className={styles.subhead}>Theme</h3>
      <div className={styles.toggleGroup}>
        <button type="button" className={theme === "light" ? styles.toggleActive : styles.toggle} onClick={() => handleSelectTheme("light")}>
          Light
        </button>
        <button type="button" className={theme === "dark" ? styles.toggleActive : styles.toggle} onClick={() => handleSelectTheme("dark")}>
          Dark
        </button>
        <button type="button" className={theme === "system" ? styles.toggleActive : styles.toggle} onClick={() => handleSelectTheme("system")}>
          System
        </button>
      </div>

      <h3 className={styles.subhead}>Spacing</h3>
      <div className={styles.layoutRow}>
        <span className={styles.label}>Density</span>
        <div className={styles.toggleGroup}>
          <button
            type="button"
            className={layout.density === "comfortable" ? styles.toggleActive : styles.toggle}
            onClick={() => updateLayout({ density: "comfortable" })}
          >
            Comfortable
          </button>
          <button
            type="button"
            className={layout.density === "compact" ? styles.toggleActive : styles.toggle}
            onClick={() => updateLayout({ density: "compact" })}
          >
            Compact
          </button>
        </div>
      </div>
      <div className={styles.layoutRow}>
        <span className={styles.label}>Content width</span>
        <div className={styles.toggleGroup}>
          <button
            type="button"
            className={layout.contentWidth === "normal" ? styles.toggleActive : styles.toggle}
            onClick={() => updateLayout({ contentWidth: "normal" })}
          >
            Normal
          </button>
          <button
            type="button"
            className={layout.contentWidth === "wide" ? styles.toggleActive : styles.toggle}
            onClick={() => updateLayout({ contentWidth: "wide" })}
          >
            Wide
          </button>
        </div>
      </div>
    </div>
  );
}
