import { describe, expect, it, beforeEach } from "vitest";
import { LAYOUT_PRESETS, DEFAULT_LAYOUT_ID, findLayoutPreset } from "./layout-presets";
import { loadLayoutId, loadLayoutPreset, saveLayoutPreset, applyLayoutPreset } from "./layout";

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
