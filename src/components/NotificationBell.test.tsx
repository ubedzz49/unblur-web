import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { NotificationBell } from "./NotificationBell";
import { renderWithProviders } from "@/test-utils";
import * as api from "@/lib/api";
import { saveToken } from "@/lib/auth";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const NOTIFICATION: api.AppNotification = {
  id: "notif-1",
  type: "booking_confirmed",
  referenceType: "booking",
  referenceId: "booking-1",
  title: "Booking confirmed",
  body: "Your session is scheduled.",
  readAt: null,
  createdAt: new Date().toISOString(),
};

describe("NotificationBell", () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveToken("test-token");
    pushMock.mockClear();
  });

  it("shows the unread count as a badge", async () => {
    vi.spyOn(api, "getUnreadNotificationCount").mockResolvedValue({ count: 3 });
    vi.spyOn(api, "getNotifications").mockResolvedValue([]);

    renderWithProviders(<NotificationBell />);

    expect(await screen.findByText("3")).toBeInTheDocument();
  });

  it("shows no badge when there are no unread notifications", async () => {
    vi.spyOn(api, "getUnreadNotificationCount").mockResolvedValue({ count: 0 });
    vi.spyOn(api, "getNotifications").mockResolvedValue([]);

    renderWithProviders(<NotificationBell />);

    await screen.findByRole("button", { name: /^notifications$/i });
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("opens the panel and lists recent notifications with title and body", async () => {
    vi.spyOn(api, "getUnreadNotificationCount").mockResolvedValue({ count: 1 });
    vi.spyOn(api, "getNotifications").mockResolvedValue([NOTIFICATION]);

    renderWithProviders(<NotificationBell />);

    fireEvent.click(await screen.findByRole("button", { name: /notifications/i }));

    expect(await screen.findByText("Booking confirmed")).toBeInTheDocument();
    expect(screen.getByText("Your session is scheduled.")).toBeInTheDocument();
  });

  it("marks a notification read and navigates to a sensible destination on click", async () => {
    vi.spyOn(api, "getUnreadNotificationCount").mockResolvedValue({ count: 1 });
    vi.spyOn(api, "getNotifications").mockResolvedValue([NOTIFICATION]);
    const markReadSpy = vi.spyOn(api, "markNotificationRead").mockResolvedValue({ ok: true });

    renderWithProviders(<NotificationBell />);

    fireEvent.click(await screen.findByRole("button", { name: /notifications/i }));
    fireEvent.click(await screen.findByText("Booking confirmed"));

    await waitFor(() => expect(markReadSpy).toHaveBeenCalledWith("test-token", NOTIFICATION.id));
    expect(pushMock).toHaveBeenCalledWith("/bookings/booking-1/payment");
  });

  it("does not re-mark an already-read notification as read on click, only navigates", async () => {
    const readNotification: api.AppNotification = { ...NOTIFICATION, readAt: new Date().toISOString() };
    vi.spyOn(api, "getUnreadNotificationCount").mockResolvedValue({ count: 0 });
    vi.spyOn(api, "getNotifications").mockResolvedValue([readNotification]);
    const markReadSpy = vi.spyOn(api, "markNotificationRead").mockResolvedValue({ ok: true });

    renderWithProviders(<NotificationBell />);

    fireEvent.click(await screen.findByRole("button", { name: /^notifications$/i }));
    fireEvent.click(await screen.findByText("Booking confirmed"));

    expect(markReadSpy).not.toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/bookings/booking-1/payment");
  });

  it("calls mark-all-read and clears the unread badge", async () => {
    vi.spyOn(api, "getUnreadNotificationCount").mockResolvedValue({ count: 2 });
    vi.spyOn(api, "getNotifications").mockResolvedValue([NOTIFICATION]);
    const markAllSpy = vi.spyOn(api, "markAllNotificationsRead").mockResolvedValue({ markedCount: 2 });

    renderWithProviders(<NotificationBell />);

    fireEvent.click(await screen.findByRole("button", { name: /notifications/i }));
    fireEvent.click(await screen.findByRole("button", { name: /mark all read/i }));

    await waitFor(() => expect(markAllSpy).toHaveBeenCalledWith("test-token"));
  });

  it("falls back to the requests hub for a non-booking notification", async () => {
    const doubtNotification: api.AppNotification = {
      ...NOTIFICATION,
      referenceType: "doubt",
      referenceId: "doubt-9",
    };
    vi.spyOn(api, "getUnreadNotificationCount").mockResolvedValue({ count: 1 });
    vi.spyOn(api, "getNotifications").mockResolvedValue([doubtNotification]);
    vi.spyOn(api, "markNotificationRead").mockResolvedValue({ ok: true });

    renderWithProviders(<NotificationBell />);

    fireEvent.click(await screen.findByRole("button", { name: /notifications/i }));
    fireEvent.click(await screen.findByText("Booking confirmed"));

    expect(pushMock).toHaveBeenCalledWith("/requests");
  });
});
