// Runs before paint so there's no flash of unstyled layout density/width.
// There is a single committed dark theme now (see globals.css) -- this script no
// longer branches on light/dark, it only restores the density/content-width prefs
// set by the appearance customizer before React hydrates.
function buildThemeInit() {
  return `
(function () {
  try {
    var root = document.documentElement;
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
