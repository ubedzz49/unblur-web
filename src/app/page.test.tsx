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
    const links = screen.getAllByRole("link", { name: /sign in|post a doubt|start resolving|post your first doubt/i });
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => expect(link).toHaveAttribute("href", "/login"));
  });

  it("links to home when signed in", () => {
    saveToken("test-token");
    renderWithProviders(<Home />);
    expect(screen.getByRole("link", { name: /go to your home/i })).toHaveAttribute("href", "/home");
  });
});
