import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import ResolveRequestPage from "./page";
import { renderWithProviders } from "@/test-utils";
import * as api from "@/lib/api";
import { saveToken } from "@/lib/auth";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
  useParams: () => ({ id: "doubt-1" }),
}));

// picks a day in the calendar's next month (every day there is guaranteed to be in
// the future, so this never depends on what "today" happens to be during a test run)
function pickSlotViaCalendar(testId: string) {
  const container = screen.getByTestId(testId);
  fireEvent.click(within(container).getByRole("button", { name: /next month/i }));
  const days = within(container).getAllByTestId("dtp-day");
  fireEvent.click(days[days.length - 1]);
}

describe("ResolveRequestPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    pushMock.mockClear();
    saveToken("test-token");
  });

  it("keeps submit disabled with no amount and no slot filled in", async () => {
    renderWithProviders(<ResolveRequestPage />);
    expect(screen.getByRole("button", { name: /send offer/i })).toBeDisabled();
  });

  it("keeps submit disabled when only the amount is filled and no slot chosen", async () => {
    renderWithProviders(<ResolveRequestPage />);

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "200" } });

    expect(screen.getByRole("button", { name: /send offer/i })).toBeDisabled();
  });

  it("keeps submit disabled when amount is zero or empty", async () => {
    renderWithProviders(<ResolveRequestPage />);

    pickSlotViaCalendar("dtp-slot-1");
    expect(screen.getByRole("button", { name: /send offer/i })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "0" } });
    expect(screen.getByRole("button", { name: /send offer/i })).toBeDisabled();
  });

  it("enables submit once a future slot is picked from the calendar and a positive amount is set", async () => {
    renderWithProviders(<ResolveRequestPage />);

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "150" } });
    pickSlotViaCalendar("dtp-slot-1");

    expect(screen.getByRole("button", { name: /send offer/i })).not.toBeDisabled();
  });

  it("supports adding and removing extra slot rows, up to 3", async () => {
    renderWithProviders(<ResolveRequestPage />);

    expect(screen.queryByTestId("dtp-slot-2")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /add another slot/i }));
    expect(screen.getByTestId("dtp-slot-2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /add another slot/i }));
    expect(screen.getByTestId("dtp-slot-3")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add another slot/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /remove/i })[0]);
    expect(screen.queryByTestId("dtp-slot-3")).not.toBeInTheDocument();
  });

  it("submits with a preset duration, converted amount in cents, and an ISO slot in the future, then navigates to feed", async () => {
    vi.spyOn(api, "createResolutionRequest").mockResolvedValue({
      id: "req-1",
      doubtId: "doubt-1",
      resolverUserId: "user-1",
      durationMins: 60,
      amountCents: 20000,
      proposedSlots: [],
      status: "pending",
      acceptedSlotAt: null,
      createdAt: new Date().toISOString(),
    });

    renderWithProviders(<ResolveRequestPage />);

    fireEvent.click(screen.getByRole("button", { name: /^60 min$/i }));
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "200" } });
    pickSlotViaCalendar("dtp-slot-1");

    fireEvent.click(screen.getByRole("button", { name: /send offer/i }));

    await waitFor(() => expect(api.createResolutionRequest).toHaveBeenCalled());
    const call = vi.mocked(api.createResolutionRequest).mock.calls[0];
    expect(call[0]).toBe("test-token");
    expect(call[1].doubtId).toBe("doubt-1");
    expect(call[1].durationMins).toBe(60);
    expect(call[1].amountCents).toBe(20000);
    expect(call[1].proposedSlots).toHaveLength(1);
    expect(new Date(call[1].proposedSlots[0]).getTime()).toBeGreaterThan(Date.now());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/feed"));
  });

  it("shows an error toast and does not navigate when the mutation fails", async () => {
    vi.spyOn(api, "createResolutionRequest").mockRejectedValue(new Error("server exploded"));

    renderWithProviders(<ResolveRequestPage />);

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "200" } });
    pickSlotViaCalendar("dtp-slot-1");
    fireEvent.click(screen.getByRole("button", { name: /send offer/i }));

    expect(await screen.findByText(/server exploded/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  describe("quick pick", () => {
    it("goes from opening the form to a submittable request using only duration, amount, and one quick-pick click", async () => {
      renderWithProviders(<ResolveRequestPage />);

      fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "100" } });
      fireEvent.click(screen.getByRole("button", { name: /in 5 min/i }));

      expect(screen.getByRole("button", { name: /send offer/i })).not.toBeDisabled();
    });

    it("produces a slot value that is genuinely later than now, not a hardcoded date", async () => {
      renderWithProviders(<ResolveRequestPage />);

      const before = Date.now();
      fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "100" } });
      fireEvent.click(screen.getByRole("button", { name: /in 15 min/i }));

      vi.spyOn(api, "createResolutionRequest").mockResolvedValue({
        id: "req-2",
        doubtId: "doubt-1",
        resolverUserId: "user-1",
        durationMins: 30,
        amountCents: 10000,
        proposedSlots: [],
        status: "pending",
        acceptedSlotAt: null,
        createdAt: new Date().toISOString(),
      });

      fireEvent.click(screen.getByRole("button", { name: /send offer/i }));

      await waitFor(() => expect(api.createResolutionRequest).toHaveBeenCalled());
      const call = vi.mocked(api.createResolutionRequest).mock.calls[0][1];
      const slotMs = new Date(call.proposedSlots[0]).getTime();
      expect(slotMs).toBeGreaterThan(before);
      // "in 15 min" should land close to +15 minutes, not some other preset
      expect(slotMs - before).toBeGreaterThan(10 * 60 * 1000);
      expect(slotMs - before).toBeLessThan(20 * 60 * 1000);
    });

    it("fills the first empty slot rather than clobbering an already-set one", async () => {
      vi.spyOn(api, "createResolutionRequest").mockResolvedValue({
        id: "req-3",
        doubtId: "doubt-1",
        resolverUserId: "user-1",
        durationMins: 30,
        amountCents: 5000,
        proposedSlots: [],
        status: "pending",
        acceptedSlotAt: null,
        createdAt: new Date().toISOString(),
      });

      renderWithProviders(<ResolveRequestPage />);

      fireEvent.click(screen.getByRole("button", { name: /add another slot/i }));
      pickSlotViaCalendar("dtp-slot-1");
      fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "50" } });

      fireEvent.click(screen.getByRole("button", { name: /in 2 min/i }));
      fireEvent.click(screen.getByRole("button", { name: /send offer/i }));

      await waitFor(() => expect(api.createResolutionRequest).toHaveBeenCalled());
      const call = vi.mocked(api.createResolutionRequest).mock.calls[0][1];
      expect(call.proposedSlots).toHaveLength(2);
      // slot 1 (calendar-picked, far in the future) survives untouched -- the quick
      // pick landed in slot 2, the first empty row, not overwriting slot 1
      const slot1Ms = new Date(call.proposedSlots[0]).getTime();
      const slot2Ms = new Date(call.proposedSlots[1]).getTime();
      expect(slot1Ms).toBeGreaterThan(Date.now() + 24 * 60 * 60 * 1000);
      expect(slot2Ms).toBeGreaterThan(Date.now());
      expect(slot2Ms).toBeLessThan(Date.now() + 10 * 60 * 1000);
    });
  });
});
