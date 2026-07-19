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

  it("sends a code, then verifies a returning user and lands on home", async () => {
    vi.spyOn(api, "sendOtp").mockResolvedValue({ sent: true, otp: "123456" });
    vi.spyOn(api, "verifyOtp").mockResolvedValue({ token: "test-token", isNewUser: false });

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
    expect(pushMock).toHaveBeenCalledWith("/home");
  });

  it("sends a new user to onboarding after verifying", async () => {
    vi.spyOn(api, "sendOtp").mockResolvedValue({ sent: true, otp: "123456" });
    vi.spyOn(api, "verifyOtp").mockResolvedValue({ token: "test-token", isNewUser: true });

    renderWithProviders(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email or phone/i), {
      target: { value: "new@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send code/i }));
    fireEvent.change(await screen.findByLabelText(/6-digit code/i), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /verify and continue/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/onboarding"));
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

  it("logs in with password and lands on home when no reset is required", async () => {
    vi.spyOn(api, "loginWithPassword").mockResolvedValue({
      token: "test-token",
      mustResetPassword: false,
    });

    renderWithProviders(<LoginPage />);

    fireEvent.click(screen.getByRole("tab", { name: /password/i }));
    fireEvent.change(screen.getByLabelText(/email or phone/i), {
      target: { value: "student@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "hunter2000" } });
    fireEvent.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() =>
      expect(api.loginWithPassword).toHaveBeenCalledWith("student@example.com", "hunter2000"),
    );
    await waitFor(() => expect(getToken()).toBe("test-token"));
    expect(pushMock).toHaveBeenCalledWith("/home");
  });

  it("routes to the forced password-change screen when a reset is required", async () => {
    vi.spyOn(api, "loginWithPassword").mockResolvedValue({
      token: "test-token",
      mustResetPassword: true,
    });

    renderWithProviders(<LoginPage />);

    fireEvent.click(screen.getByRole("tab", { name: /password/i }));
    fireEvent.change(screen.getByLabelText(/email or phone/i), {
      target: { value: "student@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "default-pass" } });
    fireEvent.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/change-password"));
    // not logged in yet -- login() must not be called until the reset completes
    expect(getToken()).toBeNull();
  });

  it("shows a toast when password login fails", async () => {
    vi.spyOn(api, "loginWithPassword").mockRejectedValue(new Error("invalid credentials"));

    renderWithProviders(<LoginPage />);

    fireEvent.click(screen.getByRole("tab", { name: /password/i }));
    fireEvent.change(screen.getByLabelText(/email or phone/i), {
      target: { value: "student@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(await screen.findByText(/didn't work/i)).toBeInTheDocument();
  });
});
