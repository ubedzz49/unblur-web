/** Contrast-check utilities (used to author the single light/dark palette in
 * globals.css and keep it honest in tests) plus density/content-width
 * preferences, which remain a free user choice independent of theme mode. */

export interface LayoutPrefs {
  density: "comfortable" | "compact";
  contentWidth: "normal" | "wide";
}

export const LAYOUT_STORAGE_KEY = "unblur:layout-prefs";

// WCAG 2.x minimum contrast ratio for normal-size body text (used for surface/ink checks).
export const MIN_CONTRAST_RATIO = 4.5;
// Floor for an accent against a page background -- looser than WCAG AA on purpose:
// accents render as bold icons/button fills, not body text.
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

/** An accent must stay legible against its own background and have some readable
 * text color on top of it. Used to author/verify the app's palette in globals.css. */
export function validateAccentColor(
  hex: string,
  label: string,
  backgrounds: { light: string; dark: string } = { light: "#f7f7fb", dark: "#0d0e14" },
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
