import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { DoubtRequestsModal } from "./DoubtRequestsModal";
import { renderWithProviders } from "@/test-utils";
import * as api from "@/lib/api";
import { saveToken } from "@/lib/auth";

const REQUESTER: api.PublicUser = {
  id: "user-2",
  name: "Asha Rao",
  photoUrl: null,
  bio: "Loves teaching calculus",
  stats: {
    minutesResolved: 120,
    avgRating: 4.8,
    ratingCount: 10,
    minutesListener: 30,
    eligibility: { canHostSeminar: false, canOrganizeGD: true, canAttendGD: true },
  },
  expertise: [{ id: "ux-1", expertiseTypeName: "Mathematics", expertiseLevelName: "Engineering" }],
};

const PENDING_REQUEST: api.ResolutionRequest = {
  id: "req-1",
  doubtId: "doubt-1",
  resolverUserId: "user-2",
  durationMins: 30,
  amountCents: 15000,
  proposedSlots: [new Date(Date.now() + 60 * 60 * 1000).toISOString()],
  status: "pending",
  acceptedSlotAt: null,
  createdAt: new Date().toISOString(),
};

describe("DoubtRequestsModal", () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveToken("test-token");
  });

  it("shows a loading state, then the requester's profile with bio and skills", async () => {
    vi.spyOn(api, "getResolutionRequests").mockResolvedValue([PENDING_REQUEST]);
    vi.spyOn(api, "getPublicUser").mockResolvedValue(REQUESTER);

    renderWithProviders(<DoubtRequestsModal doubtId="doubt-1" onClose={vi.fn()} />);

    expect(await screen.findByText("Asha Rao")).toBeInTheDocument();
    expect(screen.getByText(/loves teaching calculus/i)).toBeInTheDocument();
    expect(screen.getByText(/mathematics \(engineering\)/i)).toBeInTheDocument();
    expect(screen.getByText(/30 min/i)).toBeInTheDocument();
  });

  it("shows an empty state when the doubt has no requests", async () => {
    vi.spyOn(api, "getResolutionRequests").mockResolvedValue([]);

    renderWithProviders(<DoubtRequestsModal doubtId="doubt-1" onClose={vi.fn()} />);

    expect(await screen.findByText(/no offers yet/i)).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", async () => {
    vi.spyOn(api, "getResolutionRequests").mockResolvedValue([]);
    const onClose = vi.fn();

    renderWithProviders(<DoubtRequestsModal doubtId="doubt-1" onClose={onClose} />);

    await screen.findByText(/no offers yet/i);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose on Escape", async () => {
    vi.spyOn(api, "getResolutionRequests").mockResolvedValue([]);
    const onClose = vi.fn();

    renderWithProviders(<DoubtRequestsModal doubtId="doubt-1" onClose={onClose} />);

    await screen.findByText(/no offers yet/i);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("accepts a pending request from within the modal using the shared accept mutation", async () => {
    vi.spyOn(api, "getResolutionRequests").mockResolvedValue([PENDING_REQUEST]);
    vi.spyOn(api, "getPublicUser").mockResolvedValue(REQUESTER);
    const acceptSpy = vi.spyOn(api, "acceptResolutionRequest").mockResolvedValue({
      id: "booking-1",
      doubtId: "doubt-1",
      resolutionRequestId: PENDING_REQUEST.id,
      posterUserId: "user-1",
      resolverUserId: "user-2",
      slotAt: PENDING_REQUEST.proposedSlots[0],
      durationMins: 30,
      amountCents: 15000,
      paymentId: "payment-1",
      joinUrl: "https://unblur.daily.co/resolution-booking-1-abc123",
      status: "scheduled",
      completedAt: null,
      createdAt: new Date().toISOString(),
    });

    renderWithProviders(<DoubtRequestsModal doubtId="doubt-1" onClose={vi.fn()} />);

    await screen.findByText("Asha Rao");
    fireEvent.click(screen.getByRole("button", { name: /^accept$/i }));

    await waitFor(() =>
      expect(acceptSpy).toHaveBeenCalledWith("test-token", PENDING_REQUEST.id, PENDING_REQUEST.proposedSlots[0]),
    );
  });

  it("rejects a pending request from within the modal", async () => {
    vi.spyOn(api, "getResolutionRequests").mockResolvedValue([PENDING_REQUEST]);
    vi.spyOn(api, "getPublicUser").mockResolvedValue(REQUESTER);
    const rejectSpy = vi
      .spyOn(api, "rejectResolutionRequest")
      .mockResolvedValue({ ...PENDING_REQUEST, status: "rejected" });

    renderWithProviders(<DoubtRequestsModal doubtId="doubt-1" onClose={vi.fn()} />);

    await screen.findByText("Asha Rao");
    fireEvent.click(screen.getByRole("button", { name: /^reject$/i }));

    await waitFor(() => expect(rejectSpy).toHaveBeenCalledWith("test-token", PENDING_REQUEST.id));
  });

  it("does not show accept/reject actions for a request that's already resolved", async () => {
    vi.spyOn(api, "getResolutionRequests").mockResolvedValue([{ ...PENDING_REQUEST, status: "accepted" }]);
    vi.spyOn(api, "getPublicUser").mockResolvedValue(REQUESTER);

    renderWithProviders(<DoubtRequestsModal doubtId="doubt-1" onClose={vi.fn()} />);

    await screen.findByText("Asha Rao");
    expect(screen.queryByRole("button", { name: /^accept$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^reject$/i })).not.toBeInTheDocument();
  });

  it("shows a fallback rather than crashing when the requester's profile fails to load", async () => {
    vi.spyOn(api, "getResolutionRequests").mockResolvedValue([PENDING_REQUEST]);
    vi.spyOn(api, "getPublicUser").mockRejectedValue(new Error("network error"));

    renderWithProviders(<DoubtRequestsModal doubtId="doubt-1" onClose={vi.fn()} />);

    expect(await screen.findByText(/couldn.t load this requester.s profile/i)).toBeInTheDocument();
  });
});
