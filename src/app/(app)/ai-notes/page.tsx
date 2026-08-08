"use client";

import Link from "next/link";
import { PageTransition } from "@/components/ui/PageTransition";
import { useMyAiNotes } from "@/lib/queries/ai-notes";
import type { AiNotesDeliveryStatus } from "@/lib/api";

const STATUS_LABEL: Record<AiNotesDeliveryStatus, string> = {
  pending: "Generating",
  generated: "Finishing up",
  sent: "Delivered",
  failed: "Failed",
};

const STATUS_STYLE: Record<AiNotesDeliveryStatus, React.CSSProperties> = {
  pending: { color: "var(--dim)" },
  generated: { color: "var(--dim)" },
  sent: { color: "var(--green)" },
  failed: { color: "var(--red)" },
};

/** No mockup covers this list -- designed fresh in the same system: card rows with
 * the .detail-card / .section-label pattern from booking-detail.html, linking into
 * the existing per-delivery detail page. */
export default function AiNotesListPage() {
  const notes = useMyAiNotes();

  return (
    <PageTransition>
      <div className="mx-auto max-w-[640px] px-6 py-10">
        <h1 className="mb-2 text-fluid-title">AI notes</h1>
        <p className="mb-7 text-sm" style={{ color: "var(--dim)" }}>
          Notes and transcripts generated after sessions where AI notes were enabled.
        </p>

        {notes.isLoading && <p className="text-sm" style={{ color: "var(--dim)" }}>Loading…</p>}
        {notes.isError && <p className="text-sm" style={{ color: "var(--dim)" }}>Couldn&apos;t load your AI notes.</p>}
        {notes.isSuccess && notes.data.length === 0 && (
          <div className="rounded-2xl border p-6" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
            <p className="text-sm" style={{ color: "var(--dim)" }}>
              No AI notes yet — enable them under your profile settings and they&apos;ll show up here after a session.
            </p>
          </div>
        )}

        {notes.data?.map((delivery) => (
          <Link
            key={delivery.id}
            href={`/ai-notes/${delivery.id}`}
            className="mb-3 flex items-center justify-between rounded-2xl border p-5"
            style={{ borderColor: "var(--line)", background: "var(--surface)" }}
          >
            <div>
              <h4 className="mb-1 text-sm font-semibold capitalize">{delivery.referenceType} session</h4>
              <span className="text-xs" style={{ color: "var(--dim)" }}>
                {new Date(delivery.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <span className="text-xs font-semibold" style={STATUS_STYLE[delivery.status]}>
              {STATUS_LABEL[delivery.status]}
            </span>
          </Link>
        ))}
      </div>
    </PageTransition>
  );
}
