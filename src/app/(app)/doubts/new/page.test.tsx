import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import NewDoubtPage from "./page";
import { renderWithProviders } from "@/test-utils";
import * as api from "@/lib/api";
import { saveToken } from "@/lib/auth";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

const baseUser: api.UserProfile = {
  id: "user-1",
  email: "student@example.com",
  phone: null,
  name: "Ubed",
  photoUrl: null,
  bio: null,
  aiNotesAndTranscriptsEnabled: false,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const options: api.ExpertiseTypeOption[] = [
  {
    id: "type-maths",
    type: "academic",
    name: "Mathematics",
    slug: "mathematics",
    levels: [{ id: "level-eng", name: "Engineering (B.Tech)", slug: "engineering" }],
  },
];

describe("NewDoubtPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    pushMock.mockClear();
    saveToken("test-token");
    vi.spyOn(api, "getMe").mockResolvedValue(baseUser);
    vi.spyOn(api, "getExpertiseOptions").mockResolvedValue(options);
  });

  it("keeps submit disabled until title and expertise are filled in (description is optional)", async () => {
    renderWithProviders(<NewDoubtPage />);

    const submitButton = await screen.findByRole("button", { name: /post doubt/i });
    expect(submitButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "Help with limits" } });
    expect(submitButton).toBeDisabled();

    const search = screen.getByLabelText(/search expertise/i);
    fireEvent.focus(search);
    fireEvent.change(search, { target: { value: "mathematics" } });
    fireEvent.click(await screen.findByTestId("expertise-result"));

    expect(submitButton).not.toBeDisabled();
  });

  it("is valid with just a title when auto-detect is checked, with no expertise or description", async () => {
    renderWithProviders(<NewDoubtPage />);

    const submitButton = await screen.findByRole("button", { name: /post doubt/i });
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "Help with limits" } });
    expect(submitButton).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/figure it out for me/i));
    expect(submitButton).not.toBeDisabled();
    expect(screen.queryByLabelText(/search expertise/i)).not.toBeInTheDocument();
  });

  it("submits the doubt and navigates to the feed on success", async () => {
    vi.spyOn(api, "createDoubt").mockResolvedValue({
      id: "doubt-1",
      authorUserId: "user-1",
      title: "Help with limits",
      description: "I don't understand epsilon-delta proofs.",
      expertiseLevelId: "level-eng",
      status: "open",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      resolvedAt: null,
      matchType: "exact",
      autoDetected: false,
    });

    renderWithProviders(<NewDoubtPage />);

    fireEvent.change(await screen.findByLabelText(/title/i), { target: { value: "Help with limits" } });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "I don't understand epsilon-delta proofs." },
    });
    const search = screen.getByLabelText(/search expertise/i);
    fireEvent.focus(search);
    fireEvent.change(search, { target: { value: "mathematics" } });
    fireEvent.click(await screen.findByTestId("expertise-result"));

    fireEvent.click(screen.getByRole("button", { name: /post doubt/i }));

    await waitFor(() =>
      expect(api.createDoubt).toHaveBeenCalledWith("test-token", {
        authorUserId: "user-1",
        title: "Help with limits",
        description: "I don't understand epsilon-delta proofs.",
        expertiseLevelId: "level-eng",
      }),
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/feed"));
  });

  it("submits without a description, still passing expertiseLevelId", async () => {
    vi.spyOn(api, "createDoubt").mockResolvedValue({
      id: "doubt-1",
      authorUserId: "user-1",
      title: "Help with limits",
      description: "",
      expertiseLevelId: "level-eng",
      status: "open",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      resolvedAt: null,
      matchType: "exact",
      autoDetected: false,
    });

    renderWithProviders(<NewDoubtPage />);

    fireEvent.change(await screen.findByLabelText(/title/i), { target: { value: "Help with limits" } });
    const search = screen.getByLabelText(/search expertise/i);
    fireEvent.focus(search);
    fireEvent.change(search, { target: { value: "mathematics" } });
    fireEvent.click(await screen.findByTestId("expertise-result"));

    fireEvent.click(screen.getByRole("button", { name: /post doubt/i }));

    await waitFor(() =>
      expect(api.createDoubt).toHaveBeenCalledWith("test-token", {
        authorUserId: "user-1",
        title: "Help with limits",
        description: undefined,
        expertiseLevelId: "level-eng",
      }),
    );
  });

  it("submits with autoDetect: true and omits expertiseLevelId when auto-detect is checked", async () => {
    vi.spyOn(api, "createDoubt").mockResolvedValue({
      id: "doubt-1",
      authorUserId: "user-1",
      title: "Help with limits",
      description: "",
      expertiseLevelId: "",
      status: "open",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      resolvedAt: null,
      matchType: "exact",
      autoDetected: true,
    });

    renderWithProviders(<NewDoubtPage />);

    fireEvent.change(await screen.findByLabelText(/title/i), { target: { value: "Help with limits" } });
    fireEvent.click(screen.getByLabelText(/figure it out for me/i));

    fireEvent.click(screen.getByRole("button", { name: /post doubt/i }));

    await waitFor(() =>
      expect(api.createDoubt).toHaveBeenCalledWith("test-token", {
        authorUserId: "user-1",
        title: "Help with limits",
        description: undefined,
        autoDetect: true,
      }),
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/feed"));
  });

  it("shows an error toast and does not navigate when the mutation fails", async () => {
    vi.spyOn(api, "createDoubt").mockRejectedValue(new Error("server exploded"));

    renderWithProviders(<NewDoubtPage />);

    fireEvent.change(await screen.findByLabelText(/title/i), { target: { value: "Help with limits" } });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "I don't understand epsilon-delta proofs." },
    });
    const search = screen.getByLabelText(/search expertise/i);
    fireEvent.focus(search);
    fireEvent.change(search, { target: { value: "mathematics" } });
    fireEvent.click(await screen.findByTestId("expertise-result"));

    fireEvent.click(screen.getByRole("button", { name: /post doubt/i }));

    expect(await screen.findByText(/server exploded/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
