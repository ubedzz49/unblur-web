import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import AdminDashboardPage from "./page";
import { renderWithProviders } from "@/test-utils";
import * as api from "@/lib/api";
import { saveToken } from "@/lib/auth";

const USER: api.AdminUser = {
  id: "user-1",
  email: "student@example.com",
  phone: null,
  name: "Student One",
  photoUrl: null,
  bio: null,
  aiNotesAndTranscriptsEnabled: false,
  blockedAt: null,
  createdAt: new Date().toISOString(),
};

const COMPLAINT: api.Complaint = {
  id: "complaint-1",
  bookingId: "booking-1",
  complainantUserId: "poster-1",
  reason: "resolver left after 2 minutes",
  status: "open",
  outcome: null,
  createdAt: new Date().toISOString(),
  resolvedAt: null,
};

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveToken("admin-test-token");
  });

  it("shows the users table by default and can block a user", async () => {
    vi.spyOn(api, "getAdminUsers").mockResolvedValue([USER]);
    const blockSpy = vi.spyOn(api, "blockAdminUser").mockResolvedValue({ ...USER, blockedAt: new Date().toISOString() });

    renderWithProviders(<AdminDashboardPage />);

    expect(await screen.findByText("Student One")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^block$/i }));

    await waitFor(() => expect(blockSpy).toHaveBeenCalledWith("admin-test-token", "student@example.com"));
  });

  it("switches to the complaints tab and can dismiss an open complaint", async () => {
    vi.spyOn(api, "getAdminUsers").mockResolvedValue([]);
    vi.spyOn(api, "getAdminComplaints").mockResolvedValue([COMPLAINT]);
    const resolveSpy = vi.spyOn(api, "resolveAdminComplaint").mockResolvedValue({
      ...COMPLAINT,
      status: "resolved",
      outcome: "dismissed",
    });

    renderWithProviders(<AdminDashboardPage />);
    fireEvent.click(screen.getByRole("tab", { name: /complaints/i }));

    expect(await screen.findByText(/resolver left after 2 minutes/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));

    await waitFor(() => expect(resolveSpy).toHaveBeenCalledWith("admin-test-token", "complaint-1", "dismissed"));
  });

  it("sends a custom notification from the notifications tab", async () => {
    vi.spyOn(api, "getAdminUsers").mockResolvedValue([]);
    const sendSpy = vi.spyOn(api, "sendAdminNotification").mockResolvedValue({
      id: "notif-1",
      type: "admin_message",
      referenceType: "admin",
      referenceId: "user-2",
      title: "Heads up",
      body: "",
      readAt: null,
      createdAt: new Date().toISOString(),
    });

    renderWithProviders(<AdminDashboardPage />);
    fireEvent.click(screen.getByRole("tab", { name: /notifications/i }));

    fireEvent.change(screen.getByPlaceholderText(/user uuid/i), { target: { value: "user-2" } });
    fireEvent.change(screen.getByPlaceholderText(/notification title/i), { target: { value: "Heads up" } });
    fireEvent.click(screen.getByRole("button", { name: /send notification/i }));

    await waitFor(() => expect(sendSpy).toHaveBeenCalledWith("admin-test-token", "user-2", "Heads up", undefined));
  });
});
