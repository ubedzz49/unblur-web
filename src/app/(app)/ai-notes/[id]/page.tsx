"use client";

import { useParams } from "next/navigation";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
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
        <div className={shared.wrap} style={{ padding: "16px 0" }}>
          <Skeleton height={200} />
        </div>
      </PageTransition>
    );
  }

  if (delivery.isError) {
    return (
      <PageTransition>
        <div className={shared.wrap} style={{ padding: "16px 0" }}>
          <Card>
            <h3>Couldn&apos;t load your notes</h3>
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
        <div className={shared.wrap} style={{ padding: "16px 0" }}>
          <Card>
            <p className={shared.muted}>
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
      <div className={shared.wrap} style={{ padding: "16px 0" }}>
        <h1 className={shared.heading} style={{ fontSize: "clamp(22px, 5vw, 32px)" }}>
          AI notes and transcript
        </h1>

        {(status === "pending" || status === "generated") && (
          <Card style={{ marginBottom: 12 }}>
            <p className={shared.muted}>
              {status === "pending"
                ? "Your notes are still being generated — this page updates automatically once they're ready."
                : "Notes are generated — finishing up delivery now."}
            </p>
          </Card>
        )}

        {status === "failed" && (
          <Card style={{ marginBottom: 12 }}>
            <p className={shared.error}>
              Something went wrong generating your notes for this session. Support has been
              notified — check back later or reach out if this persists.
            </p>
          </Card>
        )}

        {status === "sent" && (
          <>
            {sentAt && (
              <p className={shared.muted} style={{ marginBottom: 12, fontSize: 12 }}>
                Delivered {formatDate(sentAt)}
              </p>
            )}
            {notesText && (
              <Card style={{ marginBottom: 12 }}>
                <h3 style={{ marginBottom: 8 }}>Notes</h3>
                <p style={{ whiteSpace: "pre-wrap" }}>{notesText}</p>
              </Card>
            )}
            {transcriptText && (
              <Card>
                <h3 style={{ marginBottom: 8 }}>Transcript</h3>
                <p style={{ whiteSpace: "pre-wrap" }}>{transcriptText}</p>
              </Card>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
