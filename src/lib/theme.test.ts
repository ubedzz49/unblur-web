import { describe, expect, it, beforeEach } from "vitest";
import {
  MIN_CONTRAST_RATIO,
  contrastRatio,
  validateCustomTheme,
  saveCustomTheme,
  loadCustomTheme,
  clearCustomTheme,
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

describe("validateCustomTheme", () => {
  it("rejects white-on-white style combinations (the explicit unreadable case)", () => {
    const result = validateCustomTheme({
      primary: "#ffffff",
      secondary: "#ffffff",
      tertiary: "#ffffff",
    });
    expect(result.valid).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("accepts the current default Scoreboard palette", () => {
    const result = validateCustomTheme({
      primary: "#c47f00",
      secondary: "#e3e8f0",
      tertiary: "#d81f3d",
    });
    expect(result.valid).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("rejects an invalid hex value", () => {
    const result = validateCustomTheme({
      primary: "banana",
      secondary: "#e3e8f0",
      tertiary: "#d81f3d",
    });
    expect(result.valid).toBe(false);
  });

  it("flags a near-invisible pastel accent against both backgrounds", () => {
    const result = validateCustomTheme({
      primary: "#f0f2f5",
      secondary: "#e3e8f0",
      tertiary: "#d81f3d",
    });
    expect(result.valid).toBe(false);
  });
});

describe("theme persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("style");
  });

  it("saveCustomTheme refuses to persist an invalid combination", () => {
    const result = saveCustomTheme({ primary: "#ffffff", secondary: "#ffffff", tertiary: "#ffffff" });
    expect(result.valid).toBe(false);
    expect(loadCustomTheme()).toBeNull();
  });

  it("saveCustomTheme persists and applies a valid combination", () => {
    const colors = { primary: "#c47f00", secondary: "#e3e8f0", tertiary: "#d81f3d" };
    const result = saveCustomTheme(colors);
    expect(result.valid).toBe(true);
    expect(loadCustomTheme()).toEqual(colors);
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("#c47f00");
  });

  it("clearCustomTheme removes stored theme and inline overrides", () => {
    saveCustomTheme({ primary: "#c47f00", secondary: "#e3e8f0", tertiary: "#d81f3d" });
    clearCustomTheme();
    expect(loadCustomTheme()).toBeNull();
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("");
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

it("MIN_CONTRAST_RATIO matches WCAG AA for normal text", () => {
  expect(MIN_CONTRAST_RATIO).toBe(4.5);
});
