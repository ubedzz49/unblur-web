import { describe, expect, it, beforeEach } from "vitest";
import { clearToken, getToken, saveToken } from "./auth";

describe("token storage", () => {
  beforeEach(() => window.localStorage.clear());

  it("returns null when nothing is stored", () => {
    expect(getToken()).toBeNull();
  });

  it("saves and reads back a token", () => {
    saveToken("abc123");
    expect(getToken()).toBe("abc123");
  });

  it("clears a stored token", () => {
    saveToken("abc123");
    clearToken();
    expect(getToken()).toBeNull();
  });
});
