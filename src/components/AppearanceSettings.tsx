"use client";

import { useState } from "react";
import { LAYOUT_PRESETS, DEFAULT_LAYOUT_ID } from "@/lib/layout-presets";
import { loadLayoutPreset, saveLayoutPreset } from "@/lib/layout";
import { loadLayoutPrefs, saveLayoutPrefs, LayoutPrefs } from "@/lib/theme";
import { cn } from "@/lib/utils";
import styles from "./AppearanceSettings.module.css";

export function AppearanceSettings() {
  const [shellId, setShellId] = useState(() => loadLayoutPreset().id);
  const [layout, setLayout] = useState<LayoutPrefs>(() => loadLayoutPrefs());

  function handleSelectShell(id: string) {
    const preset = LAYOUT_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setShellId(preset.id);
    saveLayoutPreset(preset);
    // nav chrome (sidebar/split vs top) is decided once on mount, not reactively --
    // a full reload is the simplest way to guarantee the new pattern actually applies
    window.location.reload();
  }

  function updateLayout(next: Partial<LayoutPrefs>) {
    const merged = { ...layout, ...next };
    setLayout(merged);
    saveLayoutPrefs(merged);
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>Each pattern bundles its own colors for both light and dark mode — pick the one you like, then use the sun/moon toggle to switch between its two looks.</p>
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
            >
              <span className={styles.dots} aria-hidden="true">
                <span className={styles.dot} style={{ background: preset.light.accent }} />
                <span className={styles.dot} style={{ background: preset.light.accent2 }} />
              </span>
              <span className={styles.name}>{preset.name}</span>
              <span className={styles.desc}>{preset.description}</span>
              {preset.id === DEFAULT_LAYOUT_ID && <span className={styles.defaultTag}>Default</span>}
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
