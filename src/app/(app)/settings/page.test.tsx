import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import SettingsPage from "./page";
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

describe("SettingsPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveToken("test-token");
    vi.spyOn(api, "getMe").mockResolvedValue(baseUser);
  });

  it("loads the account form and saves an edit with a success toast", async () => {
    vi.spyOn(api, "updateMe").mockResolvedValue({ ...baseUser, name: "Asha" });

    renderWithProviders(<SettingsPage />);

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
    await waitFor(() => expect(screen.getAllByText(/saved/i).length).toBeGreaterThan(0));
  });

  it("rejects an unsupported file type before ever calling the upload API", async () => {
    const uploadSpy = vi.spyOn(api, "requestPhotoUploadUrl");

    renderWithProviders(<SettingsPage />);
    const fileInput = (await screen.findByLabelText(/change photo/i)) as HTMLInputElement;

    const pdf = new File(["not an image"], "resume.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [pdf] } });

    expect(await screen.findByText(/jpeg, png, or webp/i)).toBeInTheDocument();
    expect(uploadSpy).not.toHaveBeenCalled();
  });

  it("shows appearance, language, and expertise sections alongside the account form", async () => {
    renderWithProviders(<SettingsPage />);

    await screen.findByText(/^account$/i);
    expect(screen.getByText(/your expertise/i)).toBeInTheDocument();
    expect(screen.getByText(/^appearance$/i)).toBeInTheDocument();
    expect(screen.getByText(/^language$/i)).toBeInTheDocument();
    // the appearance section is now just a light/dark/system toggle, not a pattern picker
    expect(screen.getByText(/^theme$/i)).toBeInTheDocument();
    expect(screen.getByText(/^system$/i)).toBeInTheDocument();
    // the language picker lists Hindi among the 10 languages
    expect(screen.getByText("हिन्दी")).toBeInTheDocument();
  });
});
