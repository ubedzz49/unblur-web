// Runs before paint so there's no flash of the wrong theme/colors/layout.
const THEME_INIT = `
(function () {
  try {
    var root = document.documentElement;
    var stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      root.setAttribute("data-theme", stored);
    }

    var customTheme = localStorage.getItem("unblur:custom-theme");
    if (customTheme) {
      var colors = JSON.parse(customTheme);
      if (colors.primary) root.style.setProperty("--accent", colors.primary);
      if (colors.secondary) {
        root.style.setProperty("--bg-alt", colors.secondary);
        root.style.setProperty("--elevated", colors.secondary);
      }
      if (colors.tertiary) root.style.setProperty("--accent-2", colors.tertiary);
    }

    var layoutPrefs = localStorage.getItem("unblur:layout-prefs");
    if (layoutPrefs) {
      var prefs = JSON.parse(layoutPrefs);
      root.setAttribute("data-density", prefs.density === "compact" ? "compact" : "comfortable");
      root.setAttribute("data-content-width", prefs.contentWidth === "wide" ? "wide" : "normal");
    }
  } catch (e) {}
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />;
}
