import { describe, expect, it, beforeEach } from "vitest";
import {
  MIN_ACCENT_CONTRAST_RATIO,
  contrastRatio,
  validateAccentColor,
  loadLayoutPrefs,
  saveLayoutPrefs,
} from "./theme";

describe("contrastRatio", () => {
  it("returns max contrast for black vs white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("returns ~1 for identical colors", () => {
    expect(contrastRatio("#ff4d6d", "#ff4d6d")).toBeCloseTo(1, 1);
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
    const result = validateAccentColor("#f8f7f5", "Primary");
    expect(result.valid).toBe(false);
  });

  it("rejects an invalid hex value", () => {
    expect(validateAccentColor("banana", "Primary").valid).toBe(false);
  });

  it("accepts the default Split Diagonal accent", () => {
    expect(validateAccentColor("#ff4d6d", "Primary").valid).toBe(true);
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
