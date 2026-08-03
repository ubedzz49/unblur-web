import { describe, expect, it, beforeEach } from "vitest";
import { LAYOUT_PRESETS, DEFAULT_LAYOUT_ID, findLayoutPreset } from "./layout-presets";
import { loadLayoutId, loadLayoutPreset, saveLayoutPreset, applyLayoutPreset } from "./layout";
import { validateAccentColor } from "./theme";

describe("layout presets", () => {
  it("has 8 distinct presets with no duplicate ids", () => {
    expect(LAYOUT_PRESETS).toHaveLength(8);
    expect(new Set(LAYOUT_PRESETS.map((p) => p.id)).size).toBe(8);
  });

  it("defaults to split, per the product decision", () => {
    expect(DEFAULT_LAYOUT_ID).toBe("split");
    expect(findLayoutPreset(null).id).toBe("split");
  });

  it("only split and sidebar use a non-top nav mode", () => {
    const nonTop = LAYOUT_PRESETS.filter((p) => p.mode !== "top").map((p) => p.id).sort();
    expect(nonTop).toEqual(["sidebar", "split"]);
  });

  it("falls back to the default for an unknown id", () => {
    expect(findLayoutPreset("not-a-real-id").id).toBe(DEFAULT_LAYOUT_ID);
  });

  it.each(LAYOUT_PRESETS)("$name's accent and secondary accent stay legible in both light and dark", (preset) => {
    const lightBg = { light: preset.light.bg, dark: preset.light.bg };
    const darkBg = { light: preset.dark.bg, dark: preset.dark.bg };
    const checks = [
      validateAccentColor(preset.light.accent, `${preset.name} light accent`, lightBg),
      validateAccentColor(preset.light.accent2, `${preset.name} light accent2`, lightBg),
      validateAccentColor(preset.dark.accent, `${preset.name} dark accent`, darkBg),
      validateAccentColor(preset.dark.accent2, `${preset.name} dark accent2`, darkBg),
    ];
    const reasons = checks.flatMap((c) => c.reasons);
    expect(reasons).toEqual([]);
  });
});

describe("layout persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-layout");
  });

  it("defaults to split when nothing is stored", () => {
    expect(loadLayoutId()).toBe("split");
    expect(loadLayoutPreset().id).toBe("split");
  });

  it("saveLayoutPreset persists the choice and sets data-layout", () => {
    saveLayoutPreset(findLayoutPreset("terminal"));
    expect(loadLayoutId()).toBe("terminal");
    expect(document.documentElement.getAttribute("data-layout")).toBe("terminal");
  });

  it("applyLayoutPreset sets the attribute without touching storage", () => {
    applyLayoutPreset(findLayoutPreset("neu"));
    expect(document.documentElement.getAttribute("data-layout")).toBe("neu");
    expect(window.localStorage.getItem("unblur:layout")).toBeNull();
  });
});
