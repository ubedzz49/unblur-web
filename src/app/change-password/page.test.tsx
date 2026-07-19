import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import ChangePasswordPage from "./page";
import { renderWithProviders } from "@/test-utils";
import * as api from "@/lib/api";
import { savePendingToken, getToken } from "@/lib/auth";

const pushMock = vi.fn();
const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}));

describe("ChangePasswordPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    pushMock.mockClear();
    replaceMock.mockClear();
  });

  it("disables submit until the new password is 8+ characters and matches confirmation", async () => {
    savePendingToken("pending-token");
    vi.spyOn(api, "changePassword").mockResolvedValue({ ok: true });

    renderWithProviders(<ChangePasswordPage />);

    const submit = screen.getByRole("button", { name: /save new password/i });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/current \(temporary\) password/i), {
      target: { value: "default-pass" },
    });
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: "short" } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: "short" } });
    expect(submit).toBeDisabled();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: "longenough1" } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: "different1" } });
    expect(submit).toBeDisabled();
    expect(screen.getByText(/don't match/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: "longenough1" } });
    expect(submit).not.toBeDisabled();

    expect(api.changePassword).not.toHaveBeenCalled();
  });

  it("completes a forced reset, finalizes login, and redirects to home with a toast", async () => {
    savePendingToken("pending-token");
    vi.spyOn(api, "changePassword").mockResolvedValue({ ok: true });

    renderWithProviders(<ChangePasswordPage />);

    fireEvent.change(screen.getByLabelText(/current \(temporary\) password/i), {
      target: { value: "default-pass" },
    });
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: "longenough1" } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: "longenough1" } });
    fireEvent.click(screen.getByRole("button", { name: /save new password/i }));

    await waitFor(() =>
      expect(api.changePassword).toHaveBeenCalledWith("pending-token", "longenough1", "default-pass"),
    );
    await waitFor(() => expect(getToken()).toBe("pending-token"));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/home"));
    expect(await screen.findByText(/password changed/i)).toBeInTheDocument();
  });
});
