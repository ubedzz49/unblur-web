"use client";

import { useState } from "react";
import { THEME_PRESETS, DEFAULT_PRESET_ID } from "@/lib/theme-presets";
import { loadThemePreset, saveThemePreset, resetThemePreset, findPreset, loadLayoutPrefs, saveLayoutPrefs, LayoutPrefs } from "@/lib/theme";
import { LAYOUT_PRESETS } from "@/lib/layout-presets";
import { loadLayoutPreset, saveLayoutPreset } from "@/lib/layout";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import styles from "./ThemeCustomizer.module.css";

export function ThemeCustomizer() {
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState(() => loadThemePreset().id);
  const [layout, setLayout] = useState<LayoutPrefs>(() => loadLayoutPrefs());
  const [shellId, setShellId] = useState(() => loadLayoutPreset().id);

  function handleSelectShell(id: string) {
    const preset = LAYOUT_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setShellId(preset.id);
    saveLayoutPreset(preset);
    // nav chrome (sidebar/split vs top) is decided once on mount, not reactively --
    // a full reload is the simplest way to guarantee the new shell actually applies
    window.location.reload();
  }

  function handleSelect(id: string) {
    const preset = findPreset(id);
    setSelectedId(preset.id);
    saveThemePreset(preset);
    showToast(`Theme set to ${preset.name}`);
  }

  function handleReset() {
    resetThemePreset();
    setSelectedId(DEFAULT_PRESET_ID);
    showToast("Theme reset to default");
  }

  function updateLayout(next: Partial<LayoutPrefs>) {
    const merged = { ...layout, ...next };
    setLayout(merged);
    saveLayoutPrefs(merged);
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>Every combination below is pre-checked for readability, so any pick stays legible in both light and dark mode.</p>
      <div className={styles.grid}>
        {THEME_PRESETS.map((preset) => {
          const active = preset.id === selectedId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelect(preset.id)}
              className={cn(styles.swatch, active && styles.swatchActive)}
              aria-pressed={active}
            >
              <span className={styles.dots}>
                <span className={styles.dot} style={{ background: preset.light.primary }} />
                <span className={styles.dot} style={{ background: preset.light.tertiary }} />
              </span>
              <span className={styles.name}>{preset.name}</span>
            </button>
          );
        })}
      </div>

      <button type="button" className={styles.resetLink} onClick={handleReset}>
        Reset to default
      </button>

      <h3 className={styles.subhead}>Page layout</h3>
      <p className={styles.hint}>Changes navigation and card shape across the whole app. Switching reloads the page.</p>
      <div className={styles.grid}>
        {LAYOUT_PRESETS.map((preset) => {
          const active = preset.id === shellId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectShell(preset.id)}
              className={cn(styles.swatch, active && styles.swatchActive)}
              aria-pressed={active}
              title={preset.description}
            >
              <span className={styles.name}>{preset.name}</span>
            </button>
          );
        })}
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
