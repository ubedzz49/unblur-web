import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import RequestsPage from "./page";
import { renderWithProviders } from "@/test-utils";
import * as api from "@/lib/api";
import { saveToken } from "@/lib/auth";

vi.mock("next/navigation", () => ({
  usePathname: () => "/requests",
}));

const ME: api.UserProfile = {
  id: "user-1",
  email: "me@example.com",
  phone: null,
  name: "Me",
  photoUrl: null,
  bio: null,
  aiNotesAndTranscriptsEnabled: false,
  createdAt: new Date().toISOString(),
};

const MY_DOUBT: api.Doubt = {
  id: "doubt-1",
  authorUserId: ME.id,
  title: "How do I solve this integral?",
  description: "",
  expertiseLevelIds: [],
  status: "open",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  resolvedAt: null,
  matchType: "exact",
};

const INCOMING_REQUEST: api.ResolutionRequest = {
  id: "req-1",
  doubtId: MY_DOUBT.id,
  resolverUserId: "user-2",
  durationMins: 30,
  amountCents: 15000,
  proposedSlots: [new Date(Date.now() + 60 * 60 * 1000).toISOString(), new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()],
  status: "pending",
  acceptedSlotAt: null,
  createdAt: new Date().toISOString(),
};

const SENT_REQUEST: api.ResolutionRequest = {
  id: "req-2",
  doubtId: "doubt-2",
  resolverUserId: ME.id,
  durationMins: 15,
  amountCents: 5000,
  proposedSlots: [new Date(Date.now() + 60 * 60 * 1000).toISOString()],
  status: "pending",
  acceptedSlotAt: null,
  createdAt: new Date().toISOString(),
};

const POSTER_BOOKING: api.Booking = {
  id: "booking-1",
  doubtId: MY_DOUBT.id,
  resolutionRequestId: "req-1",
  posterUserId: ME.id,
  resolverUserId: "user-2",
  slotAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  durationMins: 30,
  amountCents: 15000,
  paymentId: "payment-1",
  status: "scheduled",
  completedAt: null,
  createdAt: new Date().toISOString(),
};

const RESOLVER_BOOKING: api.Booking = {
  ...POSTER_BOOKING,
  id: "booking-2",
  posterUserId: "user-3",
  resolverUserId: ME.id,
  status: "completed",
  completedAt: new Date().toISOString(),
};

function mockCommon() {
  vi.spyOn(api, "getMe").mockResolvedValue(ME);
}

describe("RequestsPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveToken("test-token");
    mockCommon();
  });

  it("shows a loading state then the incoming request with accept/reject actions for my doubt", async () => {
    vi.spyOn(api, "getMyDoubts").mockResolvedValue([MY_DOUBT]);
    vi.spyOn(api, "getResolutionRequests").mockImplementation((token, filters) => {
      if (filters.doubtId === MY_DOUBT.id) return Promise.resolve([INCOMING_REQUEST]);
      return Promise.resolve([]);
    });
    vi.spyOn(api, "getMyBookings").mockResolvedValue([]);

    renderWithProviders(<RequestsPage />);

    expect(await screen.findByText(MY_DOUBT.title)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^accept$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^reject$/i })).toBeInTheDocument();
  });

  it("shows an empty state when there are no doubts posted yet", async () => {
    vi.spyOn(api, "getMyDoubts").mockResolvedValue([]);
    vi.spyOn(api, "getResolutionRequests").mockResolvedValue([]);
    vi.spyOn(api, "getMyBookings").mockResolvedValue([]);

    renderWithProviders(<RequestsPage />);

    expect(await screen.findByText(/no doubts posted yet/i)).toBeInTheDocument();
  });

  it("shows a retry affordance when loading my doubts fails", async () => {
    vi.spyOn(api, "getMyDoubts").mockRejectedValue(new Error("network error"));
    vi.spyOn(api, "getResolutionRequests").mockResolvedValue([]);
    vi.spyOn(api, "getMyBookings").mockResolvedValue([]);

    renderWithProviders(<RequestsPage />);

    expect(await screen.findByText(/couldn.t load your doubts/i)).toBeInTheDocument();
  });

  it("accepting a request requires choosing one of its own proposed slots, not an arbitrary one", async () => {
    vi.spyOn(api, "getMyDoubts").mockResolvedValue([MY_DOUBT]);
    vi.spyOn(api, "getResolutionRequests").mockImplementation((token, filters) => {
      if (filters.doubtId === MY_DOUBT.id) return Promise.resolve([INCOMING_REQUEST]);
      return Promise.resolve([]);
    });
    vi.spyOn(api, "getMyBookings").mockResolvedValue([]);
    const acceptSpy = vi.spyOn(api, "acceptResolutionRequest").mockResolvedValue(POSTER_BOOKING);

    renderWithProviders(<RequestsPage />);

    await screen.findByText(MY_DOUBT.title);
    const select = screen.getByLabelText(/choose a time/i) as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toEqual(INCOMING_REQUEST.proposedSlots);

    fireEvent.change(select, { target: { value: INCOMING_REQUEST.proposedSlots[1] } });
    fireEvent.click(screen.getByRole("button", { name: /^accept$/i }));

    await waitFor(() =>
      expect(acceptSpy).toHaveBeenCalledWith("test-token", INCOMING_REQUEST.id, INCOMING_REQUEST.proposedSlots[1]),
    );
  });

  it("rejecting a request calls the reject endpoint for that request only", async () => {
    vi.spyOn(api, "getMyDoubts").mockResolvedValue([MY_DOUBT]);
    vi.spyOn(api, "getResolutionRequests").mockImplementation((token, filters) => {
      if (filters.doubtId === MY_DOUBT.id) return Promise.resolve([INCOMING_REQUEST]);
      return Promise.resolve([]);
    });
    vi.spyOn(api, "getMyBookings").mockResolvedValue([]);
    const rejectSpy = vi.spyOn(api, "rejectResolutionRequest").mockResolvedValue({ ...INCOMING_REQUEST, status: "rejected" });

    renderWithProviders(<RequestsPage />);

    await screen.findByText(MY_DOUBT.title);
    fireEvent.click(screen.getByRole("button", { name: /^reject$/i }));

    await waitFor(() => expect(rejectSpy).toHaveBeenCalledWith("test-token", INCOMING_REQUEST.id));
  });

  it("shows requests I've sent under the 'Sent by me' tab, filtered by my resolverUserId", async () => {
    vi.spyOn(api, "getMyDoubts").mockResolvedValue([]);
    const requestsSpy = vi.spyOn(api, "getResolutionRequests").mockImplementation((token, filters) => {
      if (filters.resolverUserId === ME.id) return Promise.resolve([SENT_REQUEST]);
      return Promise.resolve([]);
    });
    vi.spyOn(api, "getMyBookings").mockResolvedValue([]);

    renderWithProviders(<RequestsPage />);

    fireEvent.click(screen.getByRole("tab", { name: /sent by me/i }));

    expect(await screen.findByText(/15 min/i)).toBeInTheDocument();
    expect(requestsSpy).toHaveBeenCalledWith("test-token", { resolverUserId: ME.id });
  });

  it("separates poster-role bookings from resolver-role bookings under the Bookings tab", async () => {
    vi.spyOn(api, "getMyDoubts").mockResolvedValue([]);
    vi.spyOn(api, "getResolutionRequests").mockResolvedValue([]);
    vi.spyOn(api, "getMyBookings").mockImplementation((token, role) => {
      if (role === "poster") return Promise.resolve([POSTER_BOOKING]);
      return Promise.resolve([RESOLVER_BOOKING]);
    });

    renderWithProviders(<RequestsPage />);

    fireEvent.click(screen.getByRole("tab", { name: /bookings/i }));

    expect(await screen.findByText(/as poster/i)).toBeInTheDocument();
    expect(screen.getByText(/as resolver/i)).toBeInTheDocument();
    expect(screen.getByText(/^Scheduled$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Completed$/i)).toBeInTheDocument();
  });

  it("only shows complete/cancel actions for scheduled bookings, not completed ones", async () => {
    vi.spyOn(api, "getMyDoubts").mockResolvedValue([]);
    vi.spyOn(api, "getResolutionRequests").mockResolvedValue([]);
    vi.spyOn(api, "getMyBookings").mockImplementation((token, role) => {
      if (role === "poster") return Promise.resolve([POSTER_BOOKING]);
      return Promise.resolve([RESOLVER_BOOKING]);
    });

    renderWithProviders(<RequestsPage />);

    fireEvent.click(screen.getByRole("tab", { name: /bookings/i }));
    await screen.findByText(/as poster/i);

    // one scheduled booking -> exactly one complete/cancel pair, not one per booking
    expect(screen.getAllByRole("button", { name: /^complete$/i })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /^cancel$/i })).toHaveLength(1);
  });

  it("shows an empty state when there are no bookings in either role", async () => {
    vi.spyOn(api, "getMyDoubts").mockResolvedValue([]);
    vi.spyOn(api, "getResolutionRequests").mockResolvedValue([]);
    vi.spyOn(api, "getMyBookings").mockResolvedValue([]);

    renderWithProviders(<RequestsPage />);

    fireEvent.click(screen.getByRole("tab", { name: /bookings/i }));

    expect(await screen.findByText(/no bookings yet/i)).toBeInTheDocument();
  });
});
