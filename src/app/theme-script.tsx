import { LAYOUT_PRESETS, DEFAULT_LAYOUT_ID } from "@/lib/layout-presets";

// Runs before paint so there's no flash of the wrong pattern/colors/layout. The
// presets array is baked in at build time (JSON.stringify below) so this stays a
// single source of truth with lib/layout-presets.ts instead of a hand-duplicated copy.
function buildThemeInit() {
  return `
(function () {
  try {
    var root = document.documentElement;
    var stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      root.setAttribute("data-theme", stored);
    }
    var mode = (stored === "light" || stored === "dark") ? stored :
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

    var presets = ${JSON.stringify(LAYOUT_PRESETS)};
    var layoutId = localStorage.getItem("unblur:layout") || ${JSON.stringify(DEFAULT_LAYOUT_ID)};
    var preset = presets.find(function (p) { return p.id === layoutId; }) || presets[0];
    root.setAttribute("data-layout", preset.id);

    var colors = preset[mode];
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

    var layoutPrefs = localStorage.getItem("unblur:layout-prefs");
    if (layoutPrefs) {
      var prefs = JSON.parse(layoutPrefs);
      root.setAttribute("data-density", prefs.density === "compact" ? "compact" : "comfortable");
      root.setAttribute("data-content-width", prefs.contentWidth === "wide" ? "wide" : "normal");
    }
  } catch (e) {}
})();
`;
}

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: buildThemeInit() }} />;
}
