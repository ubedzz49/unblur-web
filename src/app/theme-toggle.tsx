"use client";

import { applyThemePreset, loadThemePreset } from "@/lib/theme";
import styles from "./theme-toggle.module.css";

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const current =
      root.getAttribute("data-theme") ??
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    window.localStorage.setItem("theme", next);
    // re-apply the saved preset's colors for the mode just switched to
    applyThemePreset(loadThemePreset());
  }

  return (
    <button type="button" className={styles.toggle} onClick={toggle}>
      Theme
    </button>
  );
}
