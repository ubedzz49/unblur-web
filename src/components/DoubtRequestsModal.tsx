"use client";

import Image from "next/image";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useResolutionRequestsForDoubt } from "@/lib/queries/resolution";
import { usePublicUser } from "@/lib/queries/users";
import { ResolutionRequest } from "@/lib/api";
import { ResolutionRequestCard } from "@/components/ResolutionRequestCard";
import styles from "./DoubtRequestsModal.module.css";

function RequesterRow({ request }: { request: ResolutionRequest }) {
  const user = usePublicUser(request.resolverUserId);

  if (user.isLoading) return <Skeleton height={60} style={{ marginBottom: 12 }} />;
  if (user.isError || !user.data) {
    return <p style={{ marginBottom: 12 }}>Couldn&apos;t load this requester&apos;s profile.</p>;
  }

  return (
    <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--line)" }}>
      <div className={styles.requesterRow}>
        {user.data.photoUrl ? (
          <Image src={user.data.photoUrl} alt="" width={44} height={44} style={{ borderRadius: "50%" }} unoptimized />
        ) : (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "var(--bg-alt)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
            }}
          >
            {(user.data.name ?? "?").trim().charAt(0).toUpperCase() || "?"}
          </div>
        )}
        <span className={styles.requesterName}>{user.data.name ?? "Someone"}</span>
      </div>

      {user.data.bio && <p className={styles.bio}>{user.data.bio}</p>}

      {user.data.expertise.length > 0 && (
        <div className={styles.skillList}>
          {user.data.expertise.map((e) => (
            <span key={e.id} className={styles.skillPill}>
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
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Offers for this doubt"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Offers to help</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
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
