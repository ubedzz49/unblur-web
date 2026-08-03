import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import ProfilePage from "./page";
import { renderWithProviders } from "@/test-utils";
import * as api from "@/lib/api";
import { saveToken } from "@/lib/auth";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const baseUser: api.UserProfile = {
  id: "user-1",
  email: "student@example.com",
  phone: null,
  name: "Ubed",
  photoUrl: null,
  bio: "Software Engineer",
  aiNotesAndTranscriptsEnabled: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("ProfilePage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveToken("test-token");
    vi.spyOn(api, "getMe").mockResolvedValue(baseUser);
  });

  it("shows the eligibility ladder with unlocked rungs marked and locked ones showing progress", async () => {
    vi.spyOn(api, "getMyStats").mockResolvedValue({
      minutesResolved: 120,
      avgRating: 4.5,
      ratingCount: 3,
      minutesListener: 30,
      gdPoints: 12.5,
      updatedAt: new Date().toISOString(),
      eligibility: { canHostSeminar: true, canOrganizeGD: false, canAttendGD: true },
    });

    renderWithProviders(<ProfilePage />);

    expect(await screen.findByText(/host a seminar/i)).toBeInTheDocument();
    expect(screen.getAllByText(/unlocked/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/organize a discussion/i)).toBeInTheDocument();
    // organize a GD is still locked even though minutesResolved cleared the 100min bar --
    // the ladder shows the server's eligibility flag, not a client-recomputed guess
    expect(
      screen.getByText((_, el) => el?.textContent === "120/100 min resolved"),
    ).toBeInTheDocument();
  });

  it("shows every rung locked with zero progress when the user has no stats yet", async () => {
    vi.spyOn(api, "getMyStats").mockResolvedValue({
      minutesResolved: 0,
      avgRating: 0,
      ratingCount: 0,
      minutesListener: 0,
      gdPoints: 0,
      updatedAt: new Date().toISOString(),
      eligibility: { canHostSeminar: false, canOrganizeGD: false, canAttendGD: false },
    });

    renderWithProviders(<ProfilePage />);

    await screen.findByText(/career stats/i);
    expect(screen.getAllByText(/locked/i).length).toBe(3);
    expect(screen.queryByText(/unlocked/i)).not.toBeInTheDocument();
  });

  it("has no local settings link, since the nav's gear icon is sufficient", async () => {
    vi.spyOn(api, "getMyStats").mockResolvedValue({
      minutesResolved: 0,
      avgRating: 0,
      ratingCount: 0,
      minutesListener: 0,
      gdPoints: 0,
      updatedAt: new Date().toISOString(),
      eligibility: { canHostSeminar: false, canOrganizeGD: false, canAttendGD: false },
    });

    renderWithProviders(<ProfilePage />);

    await screen.findByText(/software engineer/i);
    expect(screen.queryByRole("link", { name: /settings/i })).not.toBeInTheDocument();
  });
});
