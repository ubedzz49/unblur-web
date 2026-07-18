import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ProfilePage from "./page";
import * as api from "@/lib/api";
import * as auth from "@/lib/auth";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const baseUser = {
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
    vi.spyOn(auth, "getToken").mockReturnValue("test-token");
    vi.spyOn(api, "getMe").mockResolvedValue(baseUser);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a clear saved confirmation, then it fades on its own", async () => {
    vi.spyOn(api, "updateMe").mockResolvedValue(baseUser);

    render(<ProfilePage />);
    const saveButton = await screen.findByRole("button", { name: /save changes/i });

    vi.useFakeTimers();
    fireEvent.click(saveButton);
    // flushes both the resolved-promise microtasks and any due (fake) timers
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByRole("status")).toBeVisible();

    act(() => {
      vi.advanceTimersByTime(2500);
    });
    // hidden: true -- once visibility is hidden, it drops out of the default
    // accessibility tree query entirely, not just fail a visibility check
    expect(screen.getByRole("status", { hidden: true })).not.toBeVisible();
  });

  it("disables the form while a save is in flight so a second click can't fire a second request", async () => {
    let resolveUpdate!: (value: typeof baseUser) => void;
    vi.spyOn(api, "updateMe").mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );

    render(<ProfilePage />);
    const saveButton = await screen.findByRole("button", { name: /save changes/i });

    fireEvent.click(saveButton);
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    expect(api.updateMe).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();

    resolveUpdate(baseUser);
    await waitFor(() => expect(screen.getByRole("button", { name: /save changes/i })).toBeEnabled());
  });
});
