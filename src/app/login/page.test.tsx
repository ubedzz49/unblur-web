import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "./page";
import { renderWithProviders } from "@/test-utils";
import * as api from "@/lib/api";
import { getToken } from "@/lib/auth";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    pushMock.mockClear();
  });

  it("sends a code, then verifies it and saves the token", async () => {
    vi.spyOn(api, "sendOtp").mockResolvedValue({ sent: true, otp: "123456" });
    vi.spyOn(api, "verifyOtp").mockResolvedValue({ token: "test-token" });

    renderWithProviders(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email or phone/i), {
      target: { value: "student@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send code/i }));

    await waitFor(() => expect(api.sendOtp).toHaveBeenCalledWith("student@example.com"));
    expect(await screen.findByLabelText(/6-digit code/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/6-digit code/i), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /verify and continue/i }));

    await waitFor(() =>
      expect(api.verifyOtp).toHaveBeenCalledWith("student@example.com", "123456"),
    );
    await waitFor(() => expect(getToken()).toBe("test-token"));
    expect(pushMock).toHaveBeenCalledWith("/profile");
  });

  it("shows a toast when verification fails", async () => {
    vi.spyOn(api, "sendOtp").mockResolvedValue({ sent: true, otp: "123456" });
    vi.spyOn(api, "verifyOtp").mockRejectedValue(new Error("invalid or expired otp"));

    renderWithProviders(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email or phone/i), {
      target: { value: "student@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send code/i }));
    await screen.findByLabelText(/6-digit code/i);

    fireEvent.change(screen.getByLabelText(/6-digit code/i), { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: /verify and continue/i }));

    expect(await screen.findByText(/didn't work/i)).toBeInTheDocument();
  });
});
