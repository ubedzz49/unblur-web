import { DEFAULT_LAYOUT_ID, findLayoutPreset, LayoutColors, LayoutPreset } from "./layout-presets";

export const LAYOUT_PRESET_STORAGE_KEY = "unblur:layout";

export function loadLayoutId(): string {
  if (typeof window === "undefined") return DEFAULT_LAYOUT_ID;
  return window.localStorage.getItem(LAYOUT_PRESET_STORAGE_KEY) ?? DEFAULT_LAYOUT_ID;
}

export function loadLayoutPreset(): LayoutPreset {
  return findLayoutPreset(loadLayoutId());
}

function getEffectiveMode(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyColors(colors: LayoutColors) {
  const root = document.documentElement;
  root.style.setProperty("--bg", colors.bg);
  root.style.setProperty("--card", colors.card);
  root.style.setProperty("--ink", colors.ink);
  root.style.setProperty("--muted", colors.muted);
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--ring", colors.accent);
  root.style.setProperty("--gold", colors.accent);
  root.style.setProperty("--gold-foreground", colors.accentForeground);
  root.style.setProperty("--accent-2", colors.accent2);
  root.style.setProperty("--danger", colors.accent2);
  root.style.setProperty("--danger-foreground", colors.accent2Foreground);
  root.style.setProperty("--line", colors.line);
  root.style.setProperty("--elevated", colors.elevated);
  root.style.setProperty("--bg-alt", colors.elevated);
}

/** Applies the preset's structural attribute plus its colors for whichever mode
 * (light/dark) is currently active -- call again after toggling light/dark so
 * the pattern's palette follows the mode switch. */
export function applyLayoutPreset(preset: LayoutPreset) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-layout", preset.id);
  applyColors(preset[getEffectiveMode()]);
}

export function saveLayoutPreset(preset: LayoutPreset) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAYOUT_PRESET_STORAGE_KEY, preset.id);
  applyLayoutPreset(preset);
}
