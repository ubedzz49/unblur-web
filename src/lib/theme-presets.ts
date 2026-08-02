/** Curated theme presets -- replaces a free color picker with a fixed list so every
 * option is pre-checked against the contrast validator (see theme.ts) and guaranteed
 * readable. Each preset carries its own light/dark accent pair; secondary/surface
 * colors are left at the default elevated tone since varying that carries the most
 * readability risk for the least visual payoff. */

export interface ThemePreset {
  id: string;
  name: string;
  light: { primary: string; tertiary: string };
  dark: { primary: string; tertiary: string };
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: "lavender", name: "Lavender (default)", light: { primary: "#6d5fe8", tertiary: "#dc2626" }, dark: { primary: "#9b8afb", tertiary: "#f87171" } },
  { id: "amber-rose", name: "Amber & Rose", light: { primary: "#c47f00", tertiary: "#d81f3d" }, dark: { primary: "#ffb703", tertiary: "#ff3d5a" } },
  { id: "emerald-rose", name: "Emerald & Rose", light: { primary: "#0f9d58", tertiary: "#d81f3d" }, dark: { primary: "#34d399", tertiary: "#ff3d5a" } },
  { id: "ocean-coral", name: "Ocean Blue & Coral", light: { primary: "#1d6fd6", tertiary: "#e0522d" }, dark: { primary: "#5b9bff", tertiary: "#ff7a52" } },
  { id: "violet-amber", name: "Violet & Amber", light: { primary: "#7c3aed", tertiary: "#c47f00" }, dark: { primary: "#a78bfa", tertiary: "#ffb703" } },
  { id: "teal-crimson", name: "Teal & Crimson", light: { primary: "#0d9488", tertiary: "#c81e3a" }, dark: { primary: "#2dd4bf", tertiary: "#ff4d6a" } },
  { id: "indigo-tangerine", name: "Indigo & Tangerine", light: { primary: "#4338ca", tertiary: "#d9631e" }, dark: { primary: "#818cf8", tertiary: "#ff9142" } },
  { id: "cyan-magenta", name: "Cyan & Magenta", light: { primary: "#0e8ba8", tertiary: "#b6297a" }, dark: { primary: "#38bdf8", tertiary: "#ff5fb0" } },
  { id: "forest-berry", name: "Forest & Berry", light: { primary: "#2f6b3a", tertiary: "#a3225c" }, dark: { primary: "#5fae6e", tertiary: "#e2568f" } },
  { id: "sunset-navy", name: "Sunset Orange & Navy", light: { primary: "#c2540a", tertiary: "#2a4d8f" }, dark: { primary: "#ff8c3d", tertiary: "#6a94e6" } },
  { id: "royal-gold", name: "Royal Purple & Gold", light: { primary: "#6d28d9", tertiary: "#b8860b" }, dark: { primary: "#a78bfa", tertiary: "#e0b84b" } },
  { id: "sky-rose", name: "Sky & Rose", light: { primary: "#0369a1", tertiary: "#c2255c" }, dark: { primary: "#38bdf8", tertiary: "#ff6b9e" } },
  { id: "olive-plum", name: "Olive & Plum", light: { primary: "#5c6b1f", tertiary: "#7a2e6b" }, dark: { primary: "#95a94a", tertiary: "#b25aa3" } },
  { id: "copper-slate", name: "Copper & Slate", light: { primary: "#a34a1f", tertiary: "#3e5266" }, dark: { primary: "#e0813d", tertiary: "#7f97ad" } },
  { id: "lime-grape", name: "Lime & Grape", light: { primary: "#3f7d20", tertiary: "#6b2b8c" }, dark: { primary: "#7dc44a", tertiary: "#a463c9" } },
  { id: "maroon-steel", name: "Maroon & Steel", light: { primary: "#8c2f39", tertiary: "#3d5a73" }, dark: { primary: "#c96570", tertiary: "#7ba0bd" } },
];

export const DEFAULT_PRESET_ID = "lavender";
