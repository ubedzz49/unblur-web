import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import ResolveRequestPage from "./page";
import { renderWithProviders } from "@/test-utils";
import * as api from "@/lib/api";
import { saveToken } from "@/lib/auth";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
  useParams: () => ({ id: "doubt-1" }),
}));

function futureLocalDateTime(hoursFromNow: number): string {
  const d = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function pastLocalDateTime(hoursAgo: number): string {
  const d = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

  it("keeps submit disabled when a slot is in the past", async () => {
    renderWithProviders(<ResolveRequestPage />);

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "200" } });
    fireEvent.change(screen.getByLabelText(/slot 1/i), { target: { value: pastLocalDateTime(2) } });

    expect(screen.getByRole("button", { name: /send offer/i })).toBeDisabled();
    expect(screen.getByText(/pick a time in the future/i)).toBeInTheDocument();
  });

  it("keeps submit disabled when amount is zero or empty", async () => {
    renderWithProviders(<ResolveRequestPage />);

    fireEvent.change(screen.getByLabelText(/slot 1/i), { target: { value: futureLocalDateTime(3) } });
    expect(screen.getByRole("button", { name: /send offer/i })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "0" } });
    expect(screen.getByRole("button", { name: /send offer/i })).toBeDisabled();
  });

  it("enables submit once a future slot and a positive amount are filled in", async () => {
    renderWithProviders(<ResolveRequestPage />);

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "150" } });
    fireEvent.change(screen.getByLabelText(/slot 1/i), { target: { value: futureLocalDateTime(4) } });

    expect(screen.getByRole("button", { name: /send offer/i })).not.toBeDisabled();
  });

  it("supports adding and removing extra slot rows, up to 3", async () => {
    renderWithProviders(<ResolveRequestPage />);

    expect(screen.queryByLabelText(/slot 2/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /add another slot/i }));
    expect(screen.getByLabelText(/slot 2/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /add another slot/i }));
    expect(screen.getByLabelText(/slot 3/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add another slot/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /remove/i })[0]);
    expect(screen.queryByLabelText(/slot 3/i)).not.toBeInTheDocument();
  });

  it("submits with a preset duration, converted amount in cents, and ISO slots, then navigates to feed", async () => {
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
    const slotValue = futureLocalDateTime(5);
    fireEvent.change(screen.getByLabelText(/slot 1/i), { target: { value: slotValue } });

    fireEvent.click(screen.getByRole("button", { name: /send offer/i }));

    await waitFor(() =>
      expect(api.createResolutionRequest).toHaveBeenCalledWith("test-token", {
        doubtId: "doubt-1",
        durationMins: 60,
        amountCents: 20000,
        proposedSlots: [new Date(slotValue).toISOString()],
      }),
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/feed"));
  });

  it("shows an error toast and does not navigate when the mutation fails", async () => {
    vi.spyOn(api, "createResolutionRequest").mockRejectedValue(new Error("server exploded"));

    renderWithProviders(<ResolveRequestPage />);

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "200" } });
    fireEvent.change(screen.getByLabelText(/slot 1/i), { target: { value: futureLocalDateTime(2) } });
    fireEvent.click(screen.getByRole("button", { name: /send offer/i }));

    expect(await screen.findByText(/server exploded/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
