"use client";

import { useParams } from "next/navigation";
import { PageTransition } from "@/components/ui/PageTransition";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card, Pill, SectionLabel } from "@/components/scoreboard/kit";
import { useAiNotesDelivery } from "@/lib/queries/ai-notes";
import shared from "../../../shared.module.css";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AiNotesDeliveryPage() {
  const params = useParams<{ id: string }>();
  const delivery = useAiNotesDelivery(params.id);

  if (delivery.isLoading) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-2xl px-4 py-6">
          <Skeleton height={200} />
        </div>
      </PageTransition>
    );
  }

  if (delivery.isError) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-2xl px-4 py-6">
          <Card className="p-5">
            <h3 className="mb-3 text-lg font-bold">Couldn&apos;t load your notes</h3>
            <Button type="button" onClick={() => delivery.refetch()}>
              Try again
            </Button>
          </Card>
        </div>
      </PageTransition>
    );
  }

  if (!delivery.data) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-2xl px-4 py-6">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">
              This delivery doesn&apos;t exist, or isn&apos;t yours to view.
            </p>
          </Card>
        </div>
      </PageTransition>
    );
  }

  const { status, notesText, transcriptText, sentAt } = delivery.data;

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-extrabold leading-tight sm:text-3xl">
          AI notes and transcript
        </h1>

        {(status === "pending" || status === "generated") && (
          <Card className="p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Pill tone="outline">{status === "pending" ? "Generating" : "Finishing up"}</Pill>
            </div>
            <p className="text-sm text-muted-foreground">
              {status === "pending"
                ? "Your notes are still being generated — this page updates automatically once they're ready."
                : "Notes are generated — finishing up delivery now."}
            </p>
          </Card>
        )}

        {status === "failed" && (
          <Card className="p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Pill tone="danger">Failed</Pill>
            </div>
            <p className={shared.error}>
              Something went wrong generating your notes for this session. Support has been
              notified — check back later or reach out if this persists.
            </p>
          </Card>
        )}

        {status === "sent" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="success">Delivered</Pill>
              {sentAt && <span className="text-xs text-muted-foreground">{formatDate(sentAt)}</span>}
            </div>

            {notesText && (
              <section>
                <SectionLabel>Notes</SectionLabel>
                <Card className="p-5">
                  <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{notesText}</p>
                </Card>
              </section>
            )}
            {transcriptText && (
              <section>
                <SectionLabel>Transcript</SectionLabel>
                <Card className="p-5">
                  <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{transcriptText}</p>
                </Card>
              </section>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
