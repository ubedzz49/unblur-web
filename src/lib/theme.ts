/** Custom theme + layout preferences, persisted client-side, gated by a contrast check
 * so a user can never save colors that would make text unreadable (e.g. white-on-white). */

export interface CustomThemeColors {
  primary: string;
  secondary: string;
  tertiary: string;
}

export interface LayoutPrefs {
  density: "comfortable" | "compact";
  contentWidth: "normal" | "wide";
}

export const THEME_STORAGE_KEY = "unblur:custom-theme";
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

/** WCAG contrast ratio between two hex colors, 1 (no contrast) to 21 (max). Returns
 * null if either color isn't a valid #rrggbb hex. */
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
  /** Human-readable reasons a combination was rejected, empty when valid. */
  reasons: string[];
}

/** The gate every custom theme save must pass: each accent color must stay readable
 * against both the light and dark page backgrounds it could land on, and against white
 * text (since accents are also used as button backgrounds with white/near-white labels). */
const INK_LIGHT = "#0c1a2e";
const INK_DARK = "#eef4ff";

export function validateCustomTheme(
  colors: CustomThemeColors,
  backgrounds: { light: string; dark: string } = { light: "#eef1f6", dark: "#0a1626" },
): ThemeValidationResult {
  const reasons: string[] = [];

  function checkColor(hex: string, label: string) {
    if (!hexToRgb(hex)) {
      reasons.push(`${label} isn't a valid color.`);
      return false;
    }
    return true;
  }

  // primary/tertiary render as button fills and status text/icons directly on the
  // page background in both themes -- they need to stand out against both, and have
  // *some* readable text color sitting on top of them.
  function checkAccent(hex: string, label: string) {
    if (!checkColor(hex, label)) return;
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
    if (
      vsWhite !== null &&
      vsBlack !== null &&
      vsWhite < MIN_ACCENT_CONTRAST_RATIO &&
      vsBlack < MIN_ACCENT_CONTRAST_RATIO
    ) {
      reasons.push(`${label} wouldn't have any readable text color to sit under it.`);
    }
  }

  // secondary renders as a surface (card/elevated background) with regular ink text
  // on top of it in whichever theme is active -- the thing that must stay readable
  // is ink-on-secondary, not secondary-on-page-background.
  function checkSurface(hex: string, label: string) {
    if (!checkColor(hex, label)) return;
    const vsLightInk = contrastRatio(hex, INK_LIGHT);
    const vsDarkInk = contrastRatio(hex, INK_DARK);
    if (vsLightInk !== null && vsLightInk < MIN_CONTRAST_RATIO && vsDarkInk !== null && vsDarkInk < MIN_CONTRAST_RATIO) {
      reasons.push(`${label} wouldn't leave any readable text color for the content sitting on it.`);
    }
  }

  checkAccent(colors.primary, "Primary");
  checkSurface(colors.secondary, "Secondary");
  checkAccent(colors.tertiary, "Tertiary");

  return { valid: reasons.length === 0, reasons };
}

export function loadCustomTheme(): CustomThemeColors | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomThemeColors) : null;
  } catch {
    return null;
  }
}

export function saveCustomTheme(colors: CustomThemeColors): ThemeValidationResult {
  const result = validateCustomTheme(colors);
  if (!result.valid) return result;
  applyCustomTheme(colors);
  window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(colors));
  return result;
}

export function clearCustomTheme() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(THEME_STORAGE_KEY);
  const root = document.documentElement;
  root.style.removeProperty("--accent");
  root.style.removeProperty("--bg-alt");
  root.style.removeProperty("--elevated");
  root.style.removeProperty("--accent-2");
}

export function applyCustomTheme(colors: CustomThemeColors) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--accent", colors.primary);
  root.style.setProperty("--bg-alt", colors.secondary);
  root.style.setProperty("--elevated", colors.secondary);
  root.style.setProperty("--accent-2", colors.tertiary);
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

/** Call once on app boot (before paint, ideally) to restore a saved theme/layout without a flash. */
export function applyStoredAppearance() {
  const theme = loadCustomTheme();
  if (theme) applyCustomTheme(theme);
  applyLayoutPrefs(loadLayoutPrefs());
}
