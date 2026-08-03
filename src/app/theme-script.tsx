// Runs before paint so there's no flash of the wrong theme. Reads the persisted
// choice (or falls back to the OS preference) and stamps data-theme onto <html>
// before React hydrates -- globals.css's :root[data-theme="..."] blocks then
// supply the actual color values, so this script only ever sets the attribute.
function buildThemeInit() {
  return `
(function () {
  try {
    var root = document.documentElement;
    var stored = localStorage.getItem("theme");
    var mode = (stored === "light" || stored === "dark") ? stored :
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    root.setAttribute("data-theme", mode);

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
