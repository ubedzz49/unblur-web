import { THEME_PRESETS, DEFAULT_PRESET_ID } from "@/lib/theme-presets";

// Runs before paint so there's no flash of the wrong theme/colors/layout. The presets
// array is baked in at build time (JSON.stringify below) so this stays a single
// source of truth with lib/theme-presets.ts instead of a hand-duplicated copy.
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

    var presets = ${JSON.stringify(THEME_PRESETS)};
    var presetId = localStorage.getItem("unblur:theme-preset") || ${JSON.stringify(DEFAULT_PRESET_ID)};
    var preset = presets.find(function (p) { return p.id === presetId; }) || presets[0];
    var colors = preset[mode];
    root.style.setProperty("--accent", colors.primary);
    root.style.setProperty("--ring", colors.primary);
    root.style.setProperty("--accent-2", colors.tertiary);

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
