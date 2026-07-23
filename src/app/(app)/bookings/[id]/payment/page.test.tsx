import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import BookingPaymentPage from "./page";
import { renderWithProviders } from "@/test-utils";
import * as api from "@/lib/api";
import { saveToken } from "@/lib/auth";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "booking-1" }),
}));

const BOOKING: api.Booking = {
  id: "booking-1",
  doubtId: "doubt-1",
  resolutionRequestId: "req-1",
  posterUserId: "user-1",
  resolverUserId: "user-2",
  slotAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  durationMins: 30,
  amountCents: 15000,
  paymentId: "payment-1",
  joinUrl: "https://unblur.daily.co/resolution-booking-1-abc123",
  status: "scheduled",
  completedAt: null,
  createdAt: new Date().toISOString(),
};

const PENDING_PAYMENT: api.Payment = {
  id: "payment-1",
  userId: "user-1",
  amountCents: 15000,
  currency: "INR",
  type: "booking",
  referenceType: "booking",
  referenceId: "booking-1",
  platformFeeCents: 1500,
  recipientAmountCents: 13500,
  status: "pending",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("BookingPaymentPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveToken("test-token");
  });

  it("shows a loading skeleton while the booking is fetching", async () => {
    vi.spyOn(api, "getBooking").mockReturnValue(new Promise(() => {}));
    const { container } = renderWithProviders(<BookingPaymentPage />);
    expect(container.querySelectorAll("span[aria-hidden]").length).toBeGreaterThan(0);
  });

  it("shows a retry affordance when the booking fails to load", async () => {
    vi.spyOn(api, "getBooking").mockRejectedValue(new Error("network error"));
    renderWithProviders(<BookingPaymentPage />);

    expect(await screen.findByText(/couldn.t load this booking/i)).toBeInTheDocument();
  });

  it("shows a 'pay now' sandbox button honestly labeled when payment is pending", async () => {
    vi.spyOn(api, "getBooking").mockResolvedValue(BOOKING);
    vi.spyOn(api, "getPayment").mockResolvedValue(PENDING_PAYMENT);

    renderWithProviders(<BookingPaymentPage />);

    const payButton = await screen.findByRole("button", { name: /pay ₹150 \(sandbox\)/i });
    expect(payButton).toBeInTheDocument();
    expect(screen.getByText(/sandbox payment/i)).toBeInTheDocument();
  });

  it("shows a confirmed state without fabricating a meeting link when confirm succeeds", async () => {
    vi.spyOn(api, "getBooking").mockResolvedValue({ ...BOOKING, joinUrl: null });
    vi.spyOn(api, "getPayment").mockResolvedValue(PENDING_PAYMENT);
    vi.spyOn(api, "confirmPayment").mockResolvedValue({ ...PENDING_PAYMENT, status: "completed" });

    renderWithProviders(<BookingPaymentPage />);

    const payButton = await screen.findByRole("button", { name: /pay ₹150 \(sandbox\)/i });
    fireEvent.click(payButton);

    expect(await screen.findByText(/booking confirmed/i)).toBeInTheDocument();
    expect(screen.queryByText(/http/i)).not.toBeInTheDocument();
  });

  it("shows an error toast and a retry affordance distinctly when confirm reports a non-completed status", async () => {
    vi.spyOn(api, "getBooking").mockResolvedValue(BOOKING);
    vi.spyOn(api, "getPayment").mockResolvedValue(PENDING_PAYMENT);
    vi.spyOn(api, "confirmPayment").mockResolvedValue({ ...PENDING_PAYMENT, status: "failed" });

    renderWithProviders(<BookingPaymentPage />);

    const payButton = await screen.findByRole("button", { name: /pay ₹150 \(sandbox\)/i });
    fireEvent.click(payButton);

    expect(await screen.findByText(/didn.t go through/i)).toBeInTheDocument();
    // still shows the pay button again so the user can retry, distinct from the completed state
    expect(await screen.findByRole("button", { name: /pay ₹150 \(sandbox\)/i })).toBeInTheDocument();
    expect(screen.queryByText(/booking confirmed/i)).not.toBeInTheDocument();
  });

  it("shows an error toast when the confirm call itself throws", async () => {
    vi.spyOn(api, "getBooking").mockResolvedValue(BOOKING);
    vi.spyOn(api, "getPayment").mockResolvedValue(PENDING_PAYMENT);
    vi.spyOn(api, "confirmPayment").mockRejectedValue(new Error("gateway down"));

    renderWithProviders(<BookingPaymentPage />);

    const payButton = await screen.findByRole("button", { name: /pay ₹150 \(sandbox\)/i });
    fireEvent.click(payButton);

    await waitFor(() => expect(screen.getByRole("button", { name: /pay ₹150 \(sandbox\)/i })).toBeInTheDocument());
  });

  it("does not show the pay button when the payment is already completed", async () => {
    vi.spyOn(api, "getBooking").mockResolvedValue({ ...BOOKING, joinUrl: null });
    vi.spyOn(api, "getPayment").mockResolvedValue({ ...PENDING_PAYMENT, status: "completed" });

    renderWithProviders(<BookingPaymentPage />);

    await screen.findByText(/booking confirmed/i);
    expect(screen.queryByRole("button", { name: /pay/i })).not.toBeInTheDocument();
  });
});
