/** Layout presets -- an orthogonal choice from the color theme (theme-presets.ts).
 * A layout controls shape language (corner radius, shadow, border weight, display
 * typeface) app-wide, and for two of them ("sidebar", "split") the navigation
 * chrome itself: a persistent side rail instead of a top header + bottom tab bar. */

export interface LayoutPreset {
  id: string;
  name: string;
  /** Structural nav mode -- "top" reuses the existing sticky header + mobile tab
   * bar; "side"/"split" render a persistent left rail instead. */
  mode: "top" | "side" | "split";
  description: string;
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  { id: "split", name: "Split Diagonal", mode: "split", description: "A solid brand-color panel with a diagonal edge holds navigation and your score; content sits in a rounded panel alongside it." },
  { id: "bento", name: "Bento Deck", mode: "top", description: "Bold, generously rounded tiles at varying sizes -- the scoreboard feel taken further." },
  { id: "sidebar", name: "Sidebar Command", mode: "side", description: "A persistent dark left rail replaces the top nav; content leads with a large monospace number." },
  { id: "marquee", name: "Marquee Type", mode: "top", description: "Oversized serif numerals for scores and stats -- type carries the hierarchy, chrome stays quiet." },
  { id: "deck", name: "Floating Deck", mode: "top", description: "Soft, generously shadowed cards that feel like they're floating just above the page." },
  { id: "terminal", name: "Terminal Grid", mode: "top", description: "Hard-edged bordered cells, monospace throughout -- dense and technical." },
  { id: "poster", name: "Poster Editorial", mode: "top", description: "A serif display face and hairline rules, like a page from a magazine." },
  { id: "neu", name: "Neu Soft", mode: "top", description: "Soft claymorphic surfaces with no hard borders -- chunky and tactile." },
];

export const DEFAULT_LAYOUT_ID = "split";

export function findLayoutPreset(id: string | null): LayoutPreset {
  return LAYOUT_PRESETS.find((p) => p.id === id) ?? LAYOUT_PRESETS.find((p) => p.id === DEFAULT_LAYOUT_ID)!;
}
