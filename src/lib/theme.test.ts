import { describe, expect, it, beforeEach } from "vitest";
import { THEME_PRESETS, DEFAULT_PRESET_ID } from "./theme-presets";
import {
  MIN_ACCENT_CONTRAST_RATIO,
  contrastRatio,
  validateAccentColor,
  validatePreset,
  applyThemePreset,
  saveThemePreset,
  loadThemePreset,
  resetThemePreset,
  findPreset,
  loadLayoutPrefs,
  saveLayoutPrefs,
} from "./theme";

describe("contrastRatio", () => {
  it("returns max contrast for black vs white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("returns ~1 for identical colors", () => {
    expect(contrastRatio("#c47f00", "#c47f00")).toBeCloseTo(1, 1);
  });

  it("returns null for an invalid hex", () => {
    expect(contrastRatio("not-a-color", "#ffffff")).toBeNull();
  });
});

describe("validateAccentColor", () => {
  it("rejects white (the explicit unreadable-on-white case)", () => {
    const result = validateAccentColor("#ffffff", "Primary");
    expect(result.valid).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("rejects a near-invisible pastel against the light background", () => {
    const result = validateAccentColor("#f0f2f5", "Primary");
    expect(result.valid).toBe(false);
  });

  it("rejects an invalid hex value", () => {
    expect(validateAccentColor("banana", "Primary").valid).toBe(false);
  });

  it("accepts the shipped default amber", () => {
    expect(validateAccentColor("#c47f00", "Primary").valid).toBe(true);
  });
});

describe("every curated preset", () => {
  it.each(THEME_PRESETS)("$name passes the contrast validator in both light and dark", (preset) => {
    const result = validatePreset(preset);
    expect(result.reasons).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("has no duplicate ids", () => {
    const ids = THEME_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes the documented default preset id", () => {
    expect(THEME_PRESETS.some((p) => p.id === DEFAULT_PRESET_ID)).toBe(true);
  });
});

describe("findPreset", () => {
  it("falls back to the default when the id is unknown or null", () => {
    expect(findPreset("not-a-real-id").id).toBe(DEFAULT_PRESET_ID);
    expect(findPreset(null).id).toBe(DEFAULT_PRESET_ID);
  });

  it("returns the matching preset by id", () => {
    expect(findPreset("emerald-rose").id).toBe("emerald-rose");
  });
});

describe("theme preset persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("style");
    document.documentElement.removeAttribute("data-theme");
  });

  it("saveThemePreset persists and applies the preset's light-mode colors by default", () => {
    document.documentElement.setAttribute("data-theme", "light");
    const preset = findPreset("emerald-rose");
    saveThemePreset(preset);
    expect(loadThemePreset().id).toBe("emerald-rose");
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe(preset.light.primary);
  });

  it("applies the dark-mode variant when data-theme is dark", () => {
    document.documentElement.setAttribute("data-theme", "dark");
    const preset = findPreset("emerald-rose");
    applyThemePreset(preset);
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe(preset.dark.primary);
  });

  it("resetThemePreset removes stored preset and inline overrides", () => {
    saveThemePreset(findPreset("emerald-rose"));
    resetThemePreset();
    expect(loadThemePreset().id).toBe(DEFAULT_PRESET_ID);
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("");
  });

  it("defaults to the documented default preset when nothing is stored", () => {
    expect(loadThemePreset().id).toBe(DEFAULT_PRESET_ID);
  });
});

describe("layout prefs persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to comfortable/normal", () => {
    expect(loadLayoutPrefs()).toEqual({ density: "comfortable", contentWidth: "normal" });
  });

  it("round-trips saved prefs and sets root attributes", () => {
    saveLayoutPrefs({ density: "compact", contentWidth: "wide" });
    expect(loadLayoutPrefs()).toEqual({ density: "compact", contentWidth: "wide" });
    expect(document.documentElement.getAttribute("data-density")).toBe("compact");
    expect(document.documentElement.getAttribute("data-content-width")).toBe("wide");
  });
});

it("MIN_ACCENT_CONTRAST_RATIO stays above 2 -- a real floor, not effectively disabled", () => {
  expect(MIN_ACCENT_CONTRAST_RATIO).toBeGreaterThanOrEqual(2);
});
