import { describe, expect, it } from "vitest";
import { DICTIONARIES } from "./dictionaries";
import { LOCALES } from "./locales";

describe("i18n dictionaries", () => {
  it("has a dictionary for every locale in LOCALES", () => {
    for (const locale of LOCALES) {
      expect(DICTIONARIES[locale.code], `missing dictionary for ${locale.code}`).toBeDefined();
    }
  });

  it("every dictionary has exactly the same keys as English -- no missing or stray translations", () => {
    const enKeys = Object.keys(DICTIONARIES.en).sort();
    for (const [code, dict] of Object.entries(DICTIONARIES)) {
      if (code === "en") continue;
      expect(Object.keys(dict).sort(), `key mismatch in ${code}`).toEqual(enKeys);
    }
  });

  it("no dictionary has an empty string value", () => {
    for (const [code, dict] of Object.entries(DICTIONARIES)) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value.trim().length, `${code}.${key} is empty`).toBeGreaterThan(0);
      }
    }
  });

  it("includes Hindi, per the product requirement", () => {
    expect(DICTIONARIES.hi).toBeDefined();
  });

  it("has exactly 10 languages", () => {
    expect(LOCALES).toHaveLength(10);
  });
});
