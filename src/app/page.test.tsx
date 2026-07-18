import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";
import * as auth from "@/lib/auth";

describe("Home", () => {
  it("links to login when signed out", () => {
    vi.spyOn(auth, "useIsLoggedIn").mockReturnValue(false);
    render(<Home />);
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute("href", "/login");
  });

  it("links to profile when signed in", () => {
    vi.spyOn(auth, "useIsLoggedIn").mockReturnValue(true);
    render(<Home />);
    expect(screen.getByRole("link", { name: /go to your profile/i })).toHaveAttribute(
      "href",
      "/profile",
    );
  });
});
