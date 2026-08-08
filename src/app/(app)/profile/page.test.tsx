import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
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

const baseStats: api.UserStats = {
  minutesResolved: 210,
  avgRating: 4.2,
  ratingCount: 5,
  minutesListener: 60,
  gdPoints: 128,
  updatedAt: new Date().toISOString(),
  eligibility: { canHostSeminar: false, canOrganizeGD: true, canAttendGD: true },
};

describe("ProfilePage (merged profile + settings dashboard)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveToken("test-token");
    vi.spyOn(api, "getMe").mockResolvedValue(baseUser);
    vi.spyOn(api, "getMyExpertise").mockResolvedValue([]);
    vi.spyOn(api, "getExpertiseOptions").mockResolvedValue([]);
  });

  it("shows the stat strip with real numbers from useMyStats", async () => {
    vi.spyOn(api, "getMyStats").mockResolvedValue(baseStats);
    renderWithProviders(<ProfilePage />);

    expect(await screen.findByText("210")).toBeInTheDocument();
    expect(screen.getByText("4.2")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("128")).toBeInTheDocument();
  });

  it("shows both seminar-hosting conditions and marks the eligibility as needing both", async () => {
    vi.spyOn(api, "getMyStats").mockResolvedValue(baseStats);
    renderWithProviders(<ProfilePage />);

    expect(await screen.findByText("Host a seminar")).toBeInTheDocument();
    expect(screen.getByText(/210 \/ 300 min, 4.2 \/ 3.5 rating/i)).toBeInTheDocument();
  });

  it("shows both GD conditions as eligible when the server says so", async () => {
    vi.spyOn(api, "getMyStats").mockResolvedValue(baseStats);
    renderWithProviders(<ProfilePage />);

    expect(await screen.findByText("Organize a group discussion")).toBeInTheDocument();
    expect(screen.getByText("Join a group discussion")).toBeInTheDocument();
    expect(screen.getAllByText(/eligible/i).length).toBeGreaterThanOrEqual(2);
  });

  it("shows the expertise picker for adding/removing tags", async () => {
    vi.spyOn(api, "getMyStats").mockResolvedValue(baseStats);
    renderWithProviders(<ProfilePage />);

    expect(await screen.findByLabelText(/search expertise/i)).toBeInTheDocument();
  });

  it("shows the settings block: AI notes toggle, password link, payouts link, and language picker", async () => {
    vi.spyOn(api, "getMyStats").mockResolvedValue(baseStats);
    renderWithProviders(<ProfilePage />);

    await screen.findByText(/software engineer|student@example.com/i);
    expect(screen.getByText(/ai notes and transcripts/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /change/i })).toHaveAttribute("href", "/change-password");
    expect(screen.getByRole("link", { name: /view/i })).toBeInTheDocument();
    expect(screen.getByText("हिन्दी")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
  });

  it("toggles AI notes and transcripts via the switch", async () => {
    vi.spyOn(api, "getMyStats").mockResolvedValue(baseStats);
    const updateSpy = vi.spyOn(api, "updateMe").mockResolvedValue({ ...baseUser, aiNotesAndTranscriptsEnabled: false });
    renderWithProviders(<ProfilePage />);

    const toggle = await screen.findByRole("switch");
    fireEvent.click(toggle);

    await waitFor(() =>
      expect(updateSpy).toHaveBeenCalledWith("test-token", { aiNotesAndTranscriptsEnabled: false }),
    );
  });

  it("edits the name and bio through the Edit profile form", async () => {
    vi.spyOn(api, "getMyStats").mockResolvedValue(baseStats);
    const updateSpy = vi.spyOn(api, "updateMe").mockResolvedValue({ ...baseUser, name: "Asha" });
    renderWithProviders(<ProfilePage />);

    fireEvent.click(await screen.findByRole("button", { name: /edit profile/i }));
    const nameInput = screen.getByLabelText(/^name$/i);
    fireEvent.change(nameInput, { target: { value: "Asha" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(updateSpy).toHaveBeenCalledWith("test-token", { name: "Asha", bio: "Software Engineer" }),
    );
  });
});
