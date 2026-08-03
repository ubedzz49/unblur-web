"use client";

import { applyLayoutPreset, loadLayoutPreset } from "@/lib/layout";
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
    // re-apply the current pattern's colors for the mode just switched to
    applyLayoutPreset(loadLayoutPreset());
  }

  return (
    <button type="button" className={styles.toggle} onClick={toggle}>
      Theme
    </button>
  );
}
