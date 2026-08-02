"use client";

import Link from "next/link";
import { useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card, Pill } from "@/components/scoreboard/kit";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { useMe } from "@/lib/queries/users";
import { useMyDoubts } from "@/lib/queries/doubts";
import {
  useCancelBooking,
  useCompleteBooking,
  useMyBookings,
  useResolutionRequests,
  useResolutionRequestsForDoubt,
  useSubmitRating,
} from "@/lib/queries/resolution";
import { ResolutionRequestCard } from "@/components/ResolutionRequestCard";
import { ApiError, Booking, BookingStatus, Doubt, ResolutionRequest, ResolutionRequestStatus } from "@/lib/api";
import { relativeTime } from "@/lib/relative-time";
import { isMeetingWindowOver } from "@/lib/meeting-window";
import { useComplaint, useFileComplaint } from "@/lib/queries/complaints";
import { useMyAiNotes } from "@/lib/queries/ai-notes";

type Tab = "forMyDoubts" | "sentByMe" | "bookings";

const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

const BOOKING_STATUS_TONE: Record<BookingStatus, "outline" | "gold" | "danger"> = {
  scheduled: "outline",
  completed: "gold",
  cancelled: "danger",
};

const REQUEST_STATUS_TONE: Record<ResolutionRequestStatus, "outline" | "gold" | "danger"> = {
  pending: "outline",
  accepted: "gold",
  rejected: "danger",
};

function formatAmount(amountCents: number): string {
  return `₹${(amountCents / 100).toFixed(0)}`;
}

function formatSlot(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function IncomingRequestsForDoubt({ doubt }: { doubt: Doubt }) {
  const requests = useResolutionRequestsForDoubt(doubt.id);

  const pending = (requests.data ?? []).filter((r) => r.status === "pending");
  if (requests.isLoading) return <Skeleton height={60} style={{ marginBottom: 12 }} />;
  if (requests.isError || pending.length === 0) return null;

  return (
    <>
      {pending.map((request) => (
        <Card key={request.id} className="mb-3 p-4">
          <h3 className="mb-1 text-[15px] font-extrabold">{doubt.title}</h3>
          <ResolutionRequestCard request={request} bare />
        </Card>
      ))}
    </>
  );
}

function SentRequestRow({ request }: { request: ResolutionRequest }) {
  return (
    <Card className="mb-3 p-4">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="num text-sm font-extrabold">
          {request.durationMins} min · {formatAmount(request.amountCents)}
        </span>
        <Pill tone={REQUEST_STATUS_TONE[request.status]}>{request.status}</Pill>
      </div>
      <p className="text-sm text-muted-foreground">Sent {relativeTime(request.createdAt)}</p>
    </Card>
  );
}

// poster rates 1-5 stars after a session completes. the API has no "already rated" flag on the
// booking, so we just show the form whenever the booking is completed and handle a 409 (duplicate
// rate attempt) as its own case rather than trying to guess client-side whether it's been rated.
function RatingPrompt({ bookingId }: { bookingId: string }) {
  const { showToast } = useToast();
  const submitRating = useSubmitRating();
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [outcome, setOutcome] = useState<"pending" | "rated" | "already-rated">("pending");

  async function handleSubmit() {
    if (rating < 1 || rating > 5) return;
    try {
      await submitRating.mutateAsync({ bookingId, rating, feedbackText: feedbackText || undefined });
      setOutcome("rated");
      showToast("Thanks for rating this session");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setOutcome("already-rated");
        showToast("You've already rated this session");
      } else {
        showToast(err instanceof Error ? err.message : "Couldn't submit that rating — try again.", "error");
      }
    }
  }

  if (outcome === "rated") {
    return <p className="mt-2.5 font-bold">You rated this session {rating}★</p>;
  }
  if (outcome === "already-rated") {
    return <p className="mt-2.5 text-sm text-muted-foreground">You&apos;ve already rated this session.</p>;
  }

  return (
    <div className="mt-2.5 border-t border-border pt-2.5">
      <p className="mb-1.5 text-[13px] font-bold">Rate this session</p>
      <div role="group" aria-label="Rating" className="mb-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={rating >= n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => setRating(n)}
            className={cn(
              "min-h-11 min-w-11 p-1 text-xl leading-none",
              rating >= n ? "text-primary" : "text-muted-foreground",
            )}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        aria-label="Feedback (optional)"
        placeholder="Feedback (optional)"
        value={feedbackText}
        onChange={(e) => setFeedbackText(e.target.value)}
        rows={2}
        className="mb-2 w-full rounded-xl border border-border bg-card p-2 text-base text-foreground"
      />
      <Button
        type="button"
        style={{ width: "auto" }}
        disabled={rating < 1 || rating > 5 || submitRating.isPending}
        onClick={handleSubmit}
      >
        Submit rating
      </Button>
    </div>
  );
}

// poster-only: the payout for a completed session is held for 30 minutes so this stays
// available as a real action, not just a notice, for that whole window. Filing is idempotent
// server-side (re-filing shows the existing complaint), so this just always checks first.
function ComplaintPrompt({ bookingId }: { bookingId: string }) {
  const { showToast } = useToast();
  const complaint = useComplaint(bookingId);
  const fileComplaint = useFileComplaint();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function handleSubmit() {
    if (reason.trim().length === 0) return;
    try {
      await fileComplaint.mutateAsync({ bookingId, reason: reason.trim() });
      setOpen(false);
      showToast("Issue reported — the payout stays held until it's reviewed.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't report that issue — try again.", "error");
    }
  }

  if (complaint.isLoading) return null;

  if (complaint.data) {
    const statusText =
      complaint.data.status === "open"
        ? "Reported — under review"
        : complaint.data.outcome === "upheld"
          ? "Reported — payout withheld"
          : "Reported — no issue found, payout released";
    return <p className="mt-2.5 text-sm text-muted-foreground">{statusText}</p>;
  }

  if (!open) {
    return (
      <div className="mt-2.5 border-t border-border pt-2.5">
        <Button type="button" variant="secondary" style={{ width: "auto" }} onClick={() => setOpen(true)}>
          Report an issue
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2.5 border-t border-border pt-2.5">
      <p className="mb-1.5 text-[13px] font-bold">What went wrong?</p>
      <textarea
        aria-label="Issue description"
        placeholder="Describe the issue with this session"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        className="mb-2 w-full rounded-xl border border-border bg-card p-2 text-base text-foreground"
      />
      <div className="flex gap-2">
        <Button
          type="button"
          style={{ width: "auto" }}
          disabled={reason.trim().length === 0 || fileComplaint.isPending}
          onClick={handleSubmit}
        >
          Submit report
        </Button>
        <Button type="button" variant="secondary" style={{ width: "auto" }} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function BookingRow({ booking, role }: { booking: Booking; role: "poster" | "resolver" }) {
  const { showToast } = useToast();
  const completeBooking = useCompleteBooking();
  const cancelBooking = useCancelBooking();
  const [busy, setBusy] = useState(false);

  const canAct = booking.status === "scheduled";
  const meetingEnded = isMeetingWindowOver(booking.slotAt, booking.durationMins);

  // filtered client-side -- the list is small (one row per session with the toggle on), not
  // worth a per-booking backend lookup
  const aiNotes = useMyAiNotes();
  const aiNotesDelivery = aiNotes.data?.find(
    (d) => d.referenceType === "booking" && d.referenceId === booking.id,
  );

  async function handleComplete() {
    setBusy(true);
    try {
      await completeBooking.mutateAsync(booking.id);
      showToast("Booking marked complete");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't complete that booking — try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    try {
      await cancelBooking.mutateAsync(booking.id);
      showToast("Booking cancelled");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't cancel that booking — try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-3 p-4">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-extrabold">{formatSlot(booking.slotAt)}</span>
        <Pill tone={BOOKING_STATUS_TONE[booking.status]}>{BOOKING_STATUS_LABEL[booking.status]}</Pill>
      </div>
      <p className="num mb-2.5 text-sm text-muted-foreground">
        {booking.durationMins} min · {formatAmount(booking.amountCents)} · as {role}
      </p>

      <div className="flex flex-wrap gap-2">
        {booking.status === "scheduled" && (
          <Link href={`/bookings/${booking.id}/payment`}>
            <Button type="button" variant="secondary" style={{ width: "auto" }}>
              View payment
            </Button>
          </Link>
        )}
        {booking.status === "scheduled" &&
          (meetingEnded ? (
            <Button type="button" style={{ width: "auto" }} disabled title="This meeting has ended">
              Meeting ended
            </Button>
          ) : booking.joinUrl ? (
            <Button
              type="button"
              style={{ width: "auto" }}
              onClick={() => window.open(booking.joinUrl!, "_blank", "noopener,noreferrer")}
            >
              Join meeting
            </Button>
          ) : (
            <Button type="button" style={{ width: "auto" }} disabled title="Meeting link isn't ready yet">
              Join meeting (pending)
            </Button>
          ))}
        {canAct && (
          <>
            <Button type="button" style={{ width: "auto" }} disabled={busy} onClick={handleComplete}>
              Complete
            </Button>
            <Button type="button" variant="secondary" style={{ width: "auto" }} disabled={busy} onClick={handleCancel}>
              Cancel
            </Button>
          </>
        )}
      </div>

      {booking.status === "scheduled" && !meetingEnded && booking.joinUrl && (
        <p className="mt-2 text-xs text-muted-foreground">
          This session is recorded for quality and safety. The recording is kept for 15 minutes
          after the session ends, then deleted.
        </p>
      )}

      {booking.status === "completed" && role === "resolver" && (
        <p className="mt-2.5 text-xs text-muted-foreground">
          Your payout is held for up to 30 minutes after the session, then released automatically
          unless the poster reports an issue.
        </p>
      )}

      {booking.status === "completed" && aiNotesDelivery && (
        <div className="mt-2.5">
          <Link href={`/ai-notes/${aiNotesDelivery.id}`}>
            <Button type="button" variant="secondary" style={{ width: "auto" }}>
              View AI notes
            </Button>
          </Link>
        </div>
      )}

      {booking.status === "completed" && role === "poster" && (
        <>
          <RatingPrompt bookingId={booking.id} />
          <ComplaintPrompt bookingId={booking.id} />
        </>
      )}
    </Card>
  );
}

export default function RequestsPage() {
  const [tab, setTab] = useState<Tab>("forMyDoubts");
  const me = useMe();
  const myDoubts = useMyDoubts(me.data?.id);
  const sentRequests = useResolutionRequests({ resolverUserId: me.data?.id });
  const posterBookings = useMyBookings("poster");
  const resolverBookings = useMyBookings("resolver");

  const tabs: { key: Tab; label: string }[] = [
    { key: "forMyDoubts", label: "For my doubts" },
    { key: "sentByMe", label: "Sent by me" },
    { key: "bookings", label: "Bookings" },
  ];

  return (
    <PageTransition>
      <section className="py-8">
        <h1 className="mb-3.5 text-3xl font-semibold leading-tight sm:text-4xl">Requests</h1>

        <div className="mb-5 flex gap-1 border-b border-border" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "-mb-px min-h-11 border-b-2 px-3.5 py-2.5 text-sm font-extrabold",
                tab === t.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "forMyDoubts" && (
          <>
            {myDoubts.isLoading && <Skeleton height={80} style={{ marginBottom: 12 }} />}
            {myDoubts.isError && (
              <Card className="p-4">
                <h3 className="mb-1 font-extrabold">Couldn&apos;t load your doubts</h3>
                <p className="mb-3 text-sm text-muted-foreground">Something went wrong reaching the server.</p>
                <Button type="button" onClick={() => myDoubts.refetch()}>
                  Try again
                </Button>
              </Card>
            )}
            {myDoubts.isSuccess && myDoubts.data.length === 0 && (
              <Card className="p-4">
                <h3 className="mb-1 font-extrabold">No doubts posted yet</h3>
                <p className="text-sm text-muted-foreground">Post a doubt to start receiving offers to help.</p>
              </Card>
            )}
            {myDoubts.isSuccess &&
              myDoubts.data.length > 0 &&
              myDoubts.data.map((doubt) => <IncomingRequestsForDoubt key={doubt.id} doubt={doubt} />)}
          </>
        )}

        {tab === "sentByMe" && (
          <>
            {sentRequests.isLoading && <Skeleton height={80} style={{ marginBottom: 12 }} />}
            {sentRequests.isError && (
              <Card className="p-4">
                <h3 className="mb-1 font-extrabold">Couldn&apos;t load your sent offers</h3>
                <p className="mb-3 text-sm text-muted-foreground">Something went wrong reaching the server.</p>
                <Button type="button" onClick={() => sentRequests.refetch()}>
                  Try again
                </Button>
              </Card>
            )}
            {sentRequests.isSuccess && sentRequests.data.length === 0 && (
              <Card className="p-4">
                <h3 className="mb-1 font-extrabold">You haven&apos;t offered to help with anything yet</h3>
                <p className="text-sm text-muted-foreground">Offers you send from the feed show up here.</p>
              </Card>
            )}
            {sentRequests.isSuccess &&
              sentRequests.data.map((request) => <SentRequestRow key={request.id} request={request} />)}
          </>
        )}

        {tab === "bookings" && (
          <>
            {(posterBookings.isLoading || resolverBookings.isLoading) && (
              <Skeleton height={80} style={{ marginBottom: 12 }} />
            )}
            {(posterBookings.isError || resolverBookings.isError) && (
              <Card className="p-4">
                <h3 className="mb-1 font-extrabold">Couldn&apos;t load your bookings</h3>
                <p className="mb-3 text-sm text-muted-foreground">Something went wrong reaching the server.</p>
                <Button
                  type="button"
                  onClick={() => {
                    posterBookings.refetch();
                    resolverBookings.refetch();
                  }}
                >
                  Try again
                </Button>
              </Card>
            )}
            {posterBookings.isSuccess &&
              resolverBookings.isSuccess &&
              posterBookings.data.length === 0 &&
              resolverBookings.data.length === 0 && (
                <Card className="p-4">
                  <h3 className="mb-1 font-extrabold">No bookings yet</h3>
                  <p className="text-sm text-muted-foreground">Accepted offers turn into bookings here.</p>
                </Card>
              )}
            {posterBookings.data?.map((booking) => <BookingRow key={booking.id} booking={booking} role="poster" />)}
            {resolverBookings.data?.map((booking) => <BookingRow key={booking.id} booking={booking} role="resolver" />)}
          </>
        )}
      </section>
    </PageTransition>
  );
}
