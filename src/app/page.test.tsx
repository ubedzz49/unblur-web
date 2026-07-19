import { describe, expect, it, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import Home from "./page";
import { renderWithProviders } from "@/test-utils";
import { clearToken, saveToken } from "@/lib/auth";

describe("Home", () => {
  beforeEach(() => window.localStorage.clear());

  it("links to login when signed out", () => {
    clearToken();
    renderWithProviders(<Home />);
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute("href", "/login");
  });

  it("links to profile when signed in", () => {
    saveToken("test-token");
    renderWithProviders(<Home />);
    expect(screen.getByRole("link", { name: /go to your profile/i })).toHaveAttribute(
      "href",
      "/profile",
    );
  });
});
