import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import AdminDashboardPage from "./page";
import { renderWithProviders } from "@/test-utils";
import * as api from "@/lib/api";
import { saveToken } from "@/lib/auth";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

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

function goTo(sectionLabel: string) {
  fireEvent.click(screen.getByRole("tab", { name: new RegExp(`^${sectionLabel}`, "i") }));
}

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveToken("admin-test-token");
    vi.spyOn(api, "getAdminComplaints").mockResolvedValue([]);
    vi.spyOn(api, "getAuditLog").mockResolvedValue([]);
    vi.spyOn(api, "getAdminAiNotes").mockResolvedValue([]);
    vi.spyOn(api, "getExpertiseOptions").mockResolvedValue([]);
  });

  it("shows the overview section by default", async () => {
    renderWithProviders(<AdminDashboardPage />);
    expect(await screen.findByRole("heading", { name: /overview/i })).toBeInTheDocument();
  });

  it("navigates to Users and can block a user", async () => {
    vi.spyOn(api, "getAdminUsers").mockResolvedValue([USER]);
    const blockSpy = vi.spyOn(api, "blockAdminUser").mockResolvedValue({ ...USER, blockedAt: new Date().toISOString() });

    renderWithProviders(<AdminDashboardPage />);
    goTo("Users");

    expect(await screen.findByText("Student One")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^block$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^block user$/i }));

    await waitFor(() => expect(blockSpy).toHaveBeenCalledWith("admin-test-token", "student@example.com"));
  });

  it("navigates to Complaints and can dismiss an open complaint", async () => {
    vi.spyOn(api, "getAdminComplaints").mockResolvedValue([COMPLAINT]);
    const resolveSpy = vi.spyOn(api, "resolveAdminComplaint").mockResolvedValue({
      ...COMPLAINT,
      status: "resolved",
      outcome: "dismissed",
    });

    renderWithProviders(<AdminDashboardPage />);
    goTo("Complaints");

    expect(await screen.findByText(/resolver left after 2 minutes/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^resolve$/i }));

    const select = screen.getByDisplayValue(/uphold, refund poster/i);
    fireEvent.change(select, { target: { value: "dismissed" } });
    fireEvent.click(screen.getByRole("button", { name: /confirm outcome/i }));

    await waitFor(() => expect(resolveSpy).toHaveBeenCalledWith("admin-test-token", "complaint-1", "dismissed"));
  });

  it("sends a custom notification from Communications", async () => {
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
    goTo("Communications");

    fireEvent.change(screen.getByPlaceholderText(/user uuid/i), { target: { value: "user-2" } });
    fireEvent.change(screen.getByPlaceholderText(/notification title/i), { target: { value: "Heads up" } });
    fireEvent.click(screen.getByRole("button", { name: /send notification/i }));

    await waitFor(() => expect(sendSpy).toHaveBeenCalledWith("admin-test-token", "user-2", "Heads up", undefined));
  });

  it("navigates to Communications' AI notes tab and can retry a failed delivery", async () => {
    vi.spyOn(api, "getAdminAiNotes").mockResolvedValue([
      {
        id: "delivery-1",
        userId: "user-1",
        referenceType: "booking",
        referenceId: "aaaaaaaa-1111-1111-1111-111111111111",
        transcriptText: null,
        notesText: null,
        status: "failed",
        sentAt: null,
        createdAt: new Date().toISOString(),
      },
    ]);
    const retrySpy = vi.spyOn(api, "retryAdminAiNotes").mockResolvedValue({ deliveryId: "delivery-1" });

    renderWithProviders(<AdminDashboardPage />);
    goTo("Communications");
    fireEvent.click(screen.getByRole("tab", { name: /ai notes retries/i }));

    expect(await screen.findByText(/aaaaaaaa/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => expect(retrySpy).toHaveBeenCalledWith("admin-test-token", "delivery-1"));
  });

  it("shows a locked placeholder for a planned section", async () => {
    renderWithProviders(<AdminDashboardPage />);
    goTo("Revenue dashboard");
    expect(await screen.findByText(/waiting on backend aggregation/i)).toBeInTheDocument();
  });
});
