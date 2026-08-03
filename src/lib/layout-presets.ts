/** Design patterns -- the only visual choice a user makes now. Color used to be a
 * separate free-form choice (theme-presets.ts, removed); each pattern now bundles
 * its own light and dark palette along with its shape language, so picking a
 * pattern is the whole decision. Shape tokens (radius/shadow/border/font) live in
 * globals.css under [data-layout="x"]; colors below are applied at runtime by
 * lib/layout.ts because they also depend on the light/dark toggle. */

export interface LayoutColors {
  bg: string;
  card: string;
  ink: string;
  muted: string;
  accent: string;
  accentForeground: string;
  accent2: string;
  accent2Foreground: string;
  line: string;
  elevated: string;
}

export interface LayoutPreset {
  id: string;
  name: string;
  /** Structural nav mode -- "top" reuses the sticky header + mobile tab bar;
   * "side"/"split" render a persistent left rail instead. */
  mode: "top" | "side" | "split";
  description: string;
  light: LayoutColors;
  dark: LayoutColors;
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: "split",
    name: "Split Diagonal",
    mode: "split",
    description: "A rose-accented panel with a diagonal edge holds navigation and your score; content sits alongside it.",
    light: { bg: "#fdfbf9", card: "#ffffff", ink: "#1b1120", muted: "#766c82", accent: "#ff4d6d", accentForeground: "#ffffff", accent2: "#d23a56", accent2Foreground: "#ffffff", line: "#ece5e9", elevated: "#f6f0f2" },
    dark: { bg: "#171018", card: "#211720", ink: "#f3edf1", muted: "#a8969f", accent: "#ff6f8a", accentForeground: "#2b0c16", accent2: "#ff8fa3", accent2Foreground: "#2b0c16", line: "#33232e", elevated: "#241a22" },
  },
  {
    id: "bento",
    name: "Bento Deck",
    mode: "top",
    description: "Bold, generously rounded tiles in warm orange and teal -- the scoreboard feel taken further.",
    light: { bg: "#f6f4ee", card: "#ffffff", ink: "#1c1a15", muted: "#7a7364", accent: "#ff5a36", accentForeground: "#ffffff", accent2: "#2f6f5c", accent2Foreground: "#ffffff", line: "#e6e1d3", elevated: "#efece0" },
    dark: { bg: "#14130f", card: "#1d1b16", ink: "#f2efe6", muted: "#a29b86", accent: "#ff7a56", accentForeground: "#200a04", accent2: "#4a9c82", accent2Foreground: "#ffffff", line: "#302c22", elevated: "#211f19" },
  },
  {
    id: "sidebar",
    name: "Sidebar Command",
    mode: "side",
    description: "A persistent monospace left rail in cool teal; content leads with a large numeral.",
    light: { bg: "#f2f4f4", card: "#ffffff", ink: "#14171a", muted: "#5c6268", accent: "#0e9484", accentForeground: "#ffffff", accent2: "#c94b4b", accent2Foreground: "#ffffff", line: "#dde2e2", elevated: "#e9edec" },
    dark: { bg: "#101114", card: "#17181c", ink: "#eef0f2", muted: "#82868f", accent: "#62d6c4", accentForeground: "#06231f", accent2: "#e37272", accent2Foreground: "#2b0a0a", line: "#24262b", elevated: "#1c1e22" },
  },
  {
    id: "marquee",
    name: "Marquee Type",
    mode: "top",
    description: "Oversized serif numerals in warm gold -- type carries the hierarchy, chrome stays quiet.",
    light: { bg: "#f7f5f0", card: "#ffffff", ink: "#17140d", muted: "#7a7468", accent: "#a9781a", accentForeground: "#ffffff", accent2: "#b6502b", accent2Foreground: "#ffffff", line: "#e2ddd0", elevated: "#efebe1" },
    dark: { bg: "#0b0b0c", card: "#161615", ink: "#f5f4f0", muted: "#93908c", accent: "#f2c14e", accentForeground: "#2a1d02", accent2: "#e2734a", accent2Foreground: "#2a1004", line: "#232323", elevated: "#1a1a19" },
  },
  {
    id: "deck",
    name: "Floating Deck",
    mode: "top",
    description: "Soft, generously shadowed violet cards that feel like they're floating just above the page.",
    light: { bg: "#f3ecff", card: "#ffffff", ink: "#2a1e3d", muted: "#7a6e93", accent: "#a45cff", accentForeground: "#ffffff", accent2: "#e0397d", accent2Foreground: "#ffffff", line: "#e7defa", elevated: "#ede4fb" },
    dark: { bg: "#170f24", card: "#211935", ink: "#efe8fb", muted: "#a696c2", accent: "#b57bff", accentForeground: "#1f0f38", accent2: "#ff8fc0", accent2Foreground: "#38091f", line: "#312750", elevated: "#241c3b" },
  },
  {
    id: "terminal",
    name: "Terminal Grid",
    mode: "top",
    description: "Hard-edged bordered cells in signal green, monospace throughout -- dense and technical.",
    light: { bg: "#f2f7f4", card: "#ffffff", ink: "#0d1a13", muted: "#5b6b60", accent: "#0f9d54", accentForeground: "#ffffff", accent2: "#c23f3f", accent2Foreground: "#ffffff", line: "#d7e4dc", elevated: "#e8f1ec" },
    dark: { bg: "#05070a", card: "#0b1310", ink: "#c7f0d8", muted: "#5c7568", accent: "#43e37a", accentForeground: "#04220f", accent2: "#e35a5a", accent2Foreground: "#2b0808", line: "#1b2a20", elevated: "#0d1712" },
  },
  {
    id: "poster",
    name: "Poster Editorial",
    mode: "top",
    description: "A serif display face and hairline rules in rust and slate, like a page from a magazine.",
    light: { bg: "#fbfaf7", card: "#fffdfa", ink: "#191714", muted: "#837a6c", accent: "#b3401f", accentForeground: "#ffffff", accent2: "#2c4a68", accent2Foreground: "#ffffff", line: "#ded6c6", elevated: "#f2ede2" },
    dark: { bg: "#16130f", card: "#1f1a15", ink: "#f1ece3", muted: "#a89c88", accent: "#e0703f", accentForeground: "#2a0f02", accent2: "#5c86ac", accent2Foreground: "#04141f", line: "#312a21", elevated: "#241f19" },
  },
  {
    id: "neu",
    name: "Neu Soft",
    mode: "top",
    description: "Soft claymorphic violet surfaces with no hard borders -- chunky and tactile.",
    light: { bg: "#e8e6f5", card: "#e8e6f5", ink: "#362f52", muted: "#7d759c", accent: "#6f5ce6", accentForeground: "#ffffff", accent2: "#e0648a", accent2Foreground: "#ffffff", line: "#d7d3ea", elevated: "#e8e6f5" },
    dark: { bg: "#1c1a2c", card: "#1c1a2c", ink: "#eae8f5", muted: "#8f89ad", accent: "#8f7cff", accentForeground: "#160f38", accent2: "#ff86a8", accent2Foreground: "#380019", line: "#2b2842", elevated: "#1c1a2c" },
  },
];

export const DEFAULT_LAYOUT_ID = "split";

export function findLayoutPreset(id: string | null): LayoutPreset {
  return LAYOUT_PRESETS.find((p) => p.id === id) ?? LAYOUT_PRESETS.find((p) => p.id === DEFAULT_LAYOUT_ID)!;
}
