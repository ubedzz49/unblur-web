"use client";

import { useState } from "react";
import {
  CustomThemeColors,
  LayoutPrefs,
  clearCustomTheme,
  loadCustomTheme,
  loadLayoutPrefs,
  saveCustomTheme,
  saveLayoutPrefs,
  validateCustomTheme,
} from "@/lib/theme";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import styles from "./ThemeCustomizer.module.css";

const DEFAULT_COLORS: CustomThemeColors = {
  primary: "#c47f00",
  secondary: "#e3e8f0",
  tertiary: "#d81f3d",
};

const FIELDS: { key: keyof CustomThemeColors; label: string; hint: string }[] = [
  { key: "primary", label: "Primary", hint: "Buttons, links, the accent color" },
  { key: "secondary", label: "Secondary", hint: "Card backgrounds, surfaces" },
  { key: "tertiary", label: "Tertiary", hint: "Alerts, live/danger states" },
];

export function ThemeCustomizer() {
  const { showToast } = useToast();
  const [colors, setColors] = useState<CustomThemeColors>(() => loadCustomTheme() ?? DEFAULT_COLORS);
  const [layout, setLayout] = useState<LayoutPrefs>(() => loadLayoutPrefs());

  // validated live, on every keystroke -- so an unreadable combination is disabled
  // before the user even hits save, not rejected after the fact
  const validation = validateCustomTheme(colors);

  function updateColor(key: keyof CustomThemeColors, value: string) {
    setColors((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    const result = saveCustomTheme(colors);
    if (!result.valid) {
      showToast(result.reasons[0] ?? "That combination isn't readable enough — try different colors.", "error");
      return;
    }
    showToast("Theme updated");
  }

  function handleReset() {
    clearCustomTheme();
    setColors(DEFAULT_COLORS);
    showToast("Theme reset to default");
  }

  function updateLayout(next: Partial<LayoutPrefs>) {
    const merged = { ...layout, ...next };
    setLayout(merged);
    saveLayoutPrefs(merged);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {FIELDS.map((field) => (
          <div key={field.key} className={styles.field}>
            <label htmlFor={`theme-${field.key}`} className={styles.label}>
              {field.label}
            </label>
            <div className={styles.swatchRow}>
              <input
                id={`theme-${field.key}`}
                type="color"
                value={colors[field.key]}
                onChange={(e) => updateColor(field.key, e.target.value)}
                className={styles.swatch}
                aria-describedby={`theme-${field.key}-hint`}
              />
              <span className={styles.hex}>{colors[field.key]}</span>
            </div>
            <p id={`theme-${field.key}-hint`} className={styles.hint}>
              {field.hint}
            </p>
          </div>
        ))}
      </div>

      {!validation.valid && (
        <ul className={styles.warnings} role="alert">
          {validation.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}

      <div className={styles.actions}>
        <Button type="button" onClick={handleSave} disabled={!validation.valid}>
          Save theme
        </Button>
        <Button type="button" variant="secondary" onClick={handleReset}>
          Reset to default
        </Button>
      </div>

      <h3 className={styles.subhead}>Layout</h3>
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
