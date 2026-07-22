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

describe("ProfilePage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveToken("test-token");
    vi.spyOn(api, "getMe").mockResolvedValue(baseUser);
  });

  it("loads the profile and saves an edit with a success toast", async () => {
    vi.spyOn(api, "updateMe").mockResolvedValue({ ...baseUser, name: "Asha" });

    renderWithProviders(<ProfilePage />);

    const nameInput = await screen.findByLabelText(/^name$/i);
    expect(nameInput).toHaveValue("Ubed");

    fireEvent.change(nameInput, { target: { value: "Asha" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(api.updateMe).toHaveBeenCalledWith("test-token", {
        name: "Asha",
        bio: "Software Engineer",
        aiNotesAndTranscriptsEnabled: true,
      }),
    );
    expect(await screen.findByText(/profile updated/i)).toBeInTheDocument();
  });

  it("rejects an unsupported file type before ever calling the upload API", async () => {
    const uploadSpy = vi.spyOn(api, "requestPhotoUploadUrl");

    renderWithProviders(<ProfilePage />);
    const fileInput = (await screen.findByLabelText(/change photo/i)) as HTMLInputElement;

    const pdf = new File(["not an image"], "resume.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [pdf] } });

    expect(await screen.findByText(/jpeg, png, or webp/i)).toBeInTheDocument();
    expect(uploadSpy).not.toHaveBeenCalled();
  });

  it("only shows eligibility badges that are true, not the ones that are false", async () => {
    vi.spyOn(api, "getMyStats").mockResolvedValue({
      minutesResolved: 120,
      avgRating: 4.5,
      ratingCount: 3,
      minutesListener: 30,
      updatedAt: new Date().toISOString(),
      eligibility: { canHostSeminar: true, canOrganizeGD: false, canAttendGD: true },
    });

    renderWithProviders(<ProfilePage />);

    expect(await screen.findByText(/can host a seminar/i)).toBeInTheDocument();
    expect(screen.getByText(/can attend a gd/i)).toBeInTheDocument();
    expect(screen.queryByText(/can organize a gd/i)).not.toBeInTheDocument();
  });

  it("shows no badges section when nothing is eligible yet", async () => {
    vi.spyOn(api, "getMyStats").mockResolvedValue({
      minutesResolved: 0,
      avgRating: 0,
      ratingCount: 0,
      minutesListener: 0,
      updatedAt: new Date().toISOString(),
      eligibility: { canHostSeminar: false, canOrganizeGD: false, canAttendGD: false },
    });

    renderWithProviders(<ProfilePage />);

    await screen.findByText(/your stats/i);
    expect(screen.queryByText(/can host a seminar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/can organize a gd/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/can attend a gd/i)).not.toBeInTheDocument();
    expect(await screen.findByText(/keep helping/i)).toBeInTheDocument();
  });
});
