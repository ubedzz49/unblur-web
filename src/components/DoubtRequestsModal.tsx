"use client";

import Image from "next/image";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useResolutionRequestsForDoubt } from "@/lib/queries/resolution";
import { usePublicUser } from "@/lib/queries/users";
import { ResolutionRequest } from "@/lib/api";
import { ResolutionRequestCard } from "@/components/ResolutionRequestCard";
import { Avatar } from "@/components/scoreboard/kit";

function RequesterRow({ request }: { request: ResolutionRequest }) {
  const user = usePublicUser(request.resolverUserId);

  if (user.isLoading) return <Skeleton height={60} style={{ marginBottom: 12 }} />;
  if (user.isError || !user.data) {
    return <p className="mb-3">Couldn&apos;t load this requester&apos;s profile.</p>;
  }

  const initials = (user.data.name ?? "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="mb-5 border-b border-border pb-5 last:mb-0 last:border-b-0 last:pb-0">
      <div className="mb-2.5 flex items-center gap-3">
        {user.data.photoUrl ? (
          <Image src={user.data.photoUrl} alt="" width={44} height={44} className="rounded-full" unoptimized />
        ) : (
          <Avatar initials={initials} size="md" />
        )}
        <span className="text-[15px] font-extrabold">{user.data.name ?? "Someone"}</span>
      </div>

      {user.data.bio && <p className="mb-2.5 text-[13px] text-muted-foreground">{user.data.bio}</p>}

      {user.data.expertise.length > 0 && (
        <div className="mb-3.5 flex flex-wrap gap-1.5">
          {user.data.expertise.map((e) => (
            <span
              key={e.id}
              className="rounded-full bg-elevated px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground"
            >
              {e.expertiseTypeName}
              {e.expertiseLevelName && e.expertiseLevelName.toLowerCase() !== "general"
                ? ` (${e.expertiseLevelName})`
                : ""}
            </span>
          ))}
        </div>
      )}

      <ResolutionRequestCard request={request} bare />
    </div>
  );
}

export function DoubtRequestsModal({ doubtId, onClose }: { doubtId: string; onClose: () => void }) {
  const requests = useResolutionRequestsForDoubt(doubtId);

  // close on Escape -- standard modal expectation, doesn't trap the user
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-5"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-t-[20px] border border-border bg-card p-5 sm:rounded-[20px]"
        role="dialog"
        aria-modal="true"
        aria-label="Offers for this doubt"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-extrabold">Offers to help</h2>
          <button
            type="button"
            className="flex min-h-11 min-w-11 items-center justify-center text-xl text-muted-foreground"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {requests.isLoading && <Skeleton height={80} style={{ marginBottom: 12 }} />}

        {requests.isError && <p>Couldn&apos;t load offers for this doubt.</p>}

        {requests.isSuccess && requests.data.length === 0 && <p>No offers yet.</p>}

        {requests.isSuccess &&
          requests.data.map((request) => <RequesterRow key={request.id} request={request} />)}
      </div>
    </div>
  );
}
