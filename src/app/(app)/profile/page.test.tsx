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
});
