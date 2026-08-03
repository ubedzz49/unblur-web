import { DEFAULT_LAYOUT_ID, findLayoutPreset, LayoutPreset } from "./layout-presets";

export const LAYOUT_PRESET_STORAGE_KEY = "unblur:layout";

export function loadLayoutId(): string {
  if (typeof window === "undefined") return DEFAULT_LAYOUT_ID;
  return window.localStorage.getItem(LAYOUT_PRESET_STORAGE_KEY) ?? DEFAULT_LAYOUT_ID;
}

export function loadLayoutPreset(): LayoutPreset {
  return findLayoutPreset(loadLayoutId());
}

export function applyLayoutPreset(preset: LayoutPreset) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-layout", preset.id);
}

export function saveLayoutPreset(preset: LayoutPreset) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAYOUT_PRESET_STORAGE_KEY, preset.id);
  applyLayoutPreset(preset);
}
