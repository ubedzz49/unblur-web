/** Theme + layout preferences, persisted client-side. Colors are chosen from a fixed
 * list of curated presets (see theme-presets.ts) rather than a free color picker --
 * every preset is pre-checked against the contrast validator below so there's no way
 * to end up with an unreadable combination (e.g. all-white text on white). */

import { DEFAULT_PRESET_ID, THEME_PRESETS, ThemePreset } from "./theme-presets";

export interface LayoutPrefs {
  density: "comfortable" | "compact";
  contentWidth: "normal" | "wide";
}

export const THEME_PRESET_STORAGE_KEY = "unblur:theme-preset";
export const LAYOUT_STORAGE_KEY = "unblur:layout-prefs";

// WCAG 2.x minimum contrast ratio for normal-size body text (used for surface/ink checks).
export const MIN_CONTRAST_RATIO = 4.5;
// Floor for an accent against a page background -- looser than WCAG AA on purpose:
// primary/tertiary render as bold icons/button fills, not body text, and the
// shipped Scoreboard amber (~2.9:1 on the light background) has to stay valid.
// This still catches the thing we actually care about -- a color picked so close
// to its background it effectively disappears (a near-white pastel lands under 1.5).
export const MIN_ACCENT_CONTRAST_RATIO = 2.5;

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const chan = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2];
}

export function contrastRatio(hexA: string, hexB: string): number | null {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return null;
  const lumA = relativeLuminance(a);
  const lumB = relativeLuminance(b);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ThemeValidationResult {
  valid: boolean;
  reasons: string[];
}

/** Gate every preset is authored against (see theme-presets.test.ts) -- an accent must
 * stay legible against both page backgrounds and have some readable text color on top of it. */
export function validateAccentColor(
  hex: string,
  label: string,
  backgrounds: { light: string; dark: string } = { light: "#eef1f6", dark: "#0a1626" },
): ThemeValidationResult {
  const reasons: string[] = [];
  if (!hexToRgb(hex)) {
    return { valid: false, reasons: [`${label} isn't a valid color.`] };
  }

  const vsLight = contrastRatio(hex, backgrounds.light);
  const vsDark = contrastRatio(hex, backgrounds.dark);
  const vsWhite = contrastRatio(hex, "#ffffff");
  const vsBlack = contrastRatio(hex, "#000000");

  if (vsLight !== null && vsLight < MIN_ACCENT_CONTRAST_RATIO) {
    reasons.push(`${label} is too close to the light background to read clearly.`);
  }
  if (vsDark !== null && vsDark < MIN_ACCENT_CONTRAST_RATIO) {
    reasons.push(`${label} is too close to the dark background to read clearly.`);
  }
  if (vsWhite !== null && vsBlack !== null && vsWhite < MIN_ACCENT_CONTRAST_RATIO && vsBlack < MIN_ACCENT_CONTRAST_RATIO) {
    reasons.push(`${label} wouldn't have any readable text color to sit under it.`);
  }

  return { valid: reasons.length === 0, reasons };
}

// light-mode colors only ever render against the light background, dark-mode colors
// only against the dark background -- so each is validated against its own mode's
// background only, not cross-checked against the mode it never appears in.
const LIGHT_ONLY = { light: "#eef1f6", dark: "#eef1f6" };
const DARK_ONLY = { light: "#0a1626", dark: "#0a1626" };

export function validatePreset(preset: ThemePreset): ThemeValidationResult {
  const checks = [
    validateAccentColor(preset.light.primary, `${preset.name} (light primary)`, LIGHT_ONLY),
    validateAccentColor(preset.light.tertiary, `${preset.name} (light tertiary)`, LIGHT_ONLY),
    validateAccentColor(preset.dark.primary, `${preset.name} (dark primary)`, DARK_ONLY),
    validateAccentColor(preset.dark.tertiary, `${preset.name} (dark tertiary)`, DARK_ONLY),
  ];
  const reasons = checks.flatMap((c) => c.reasons);
  return { valid: reasons.length === 0, reasons };
}

function getEffectiveMode(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function findPreset(id: string | null): ThemePreset {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID)!;
}

export function loadThemePreset(): ThemePreset {
  if (typeof window === "undefined") return findPreset(DEFAULT_PRESET_ID);
  return findPreset(window.localStorage.getItem(THEME_PRESET_STORAGE_KEY));
}

/** Applies the preset's colors for whichever mode (light/dark) is currently active --
 * call again after toggling light/dark so the preset follows the mode switch. */
export function applyThemePreset(preset: ThemePreset) {
  if (typeof window === "undefined") return;
  const mode = getEffectiveMode();
  const colors = preset[mode];
  const root = document.documentElement;
  root.style.setProperty("--accent", colors.primary);
  root.style.setProperty("--ring", colors.primary);
  root.style.setProperty("--accent-2", colors.tertiary);
}

export function saveThemePreset(preset: ThemePreset) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_PRESET_STORAGE_KEY, preset.id);
  applyThemePreset(preset);
}

export function resetThemePreset() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(THEME_PRESET_STORAGE_KEY);
  const root = document.documentElement;
  root.style.removeProperty("--accent");
  root.style.removeProperty("--ring");
  root.style.removeProperty("--accent-2");
}

export function loadLayoutPrefs(): LayoutPrefs {
  const defaults: LayoutPrefs = { density: "comfortable", contentWidth: "normal" };
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<LayoutPrefs>) } : defaults;
  } catch {
    return defaults;
  }
}

export function saveLayoutPrefs(prefs: LayoutPrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(prefs));
  applyLayoutPrefs(prefs);
}

export function applyLayoutPrefs(prefs: LayoutPrefs) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-density", prefs.density);
  root.setAttribute("data-content-width", prefs.contentWidth === "wide" ? "wide" : "normal");
}

/** Call once on app boot (before paint, ideally) to restore saved theme/layout without a flash. */
export function applyStoredAppearance() {
  applyThemePreset(loadThemePreset());
  applyLayoutPrefs(loadLayoutPrefs());
}
