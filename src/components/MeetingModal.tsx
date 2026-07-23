"use client";

import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { useEffect, useRef, useState } from "react";
import styles from "./MeetingModal.module.css";

// Embeds Daily's Prebuilt call UI directly on our own page via an iframe call frame, instead of
// sending the user to unblur.daily.co in a new tab -- same room/joinUrl, just rendered in-place.
export function MeetingModal({ joinUrl, onClose }: { joinUrl: string; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const callFrameRef = useRef<DailyCall | null>(null);
  const isJoinedRef = useRef(false);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    if (!containerRef.current) return;

    const callFrame = DailyIframe.createFrame(containerRef.current, {
      iframeStyle: { width: "100%", height: "100%", border: "0" },
      showLeaveButton: true,
    });
    callFrameRef.current = callFrame;

    callFrame.on("joined-meeting", () => {
      isJoinedRef.current = true;
      setIsJoined(true);
    });
    // "left-meeting" fires both when the user actually leaves a call they'd joined, and when the
    // room can't be joined at all (expired/deleted room) -- only auto-close in the former case, or
    // a stale/expired room silently vanishes the modal with no explanation (the bug this replaces).
    callFrame.on("left-meeting", () => {
      if (isJoinedRef.current) onClose();
    });
    callFrame.on("error", (e) => {
      setError(e?.errorMsg ?? "Couldn't connect to the meeting.");
    });

    callFrame.join({ url: joinUrl }).catch(() => {
      setError("Couldn't connect to the meeting — the room may have expired.");
    });

    return () => {
      callFrame.destroy();
      callFrameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- joinUrl/onClose intentionally captured once per mount
  }, []);

  return (
    <div className={styles.overlay} role="presentation">
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Meeting">
        <div className={styles.header}>
          <span className={styles.title}>Meeting</span>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className={styles.frameContainer}>
          {error ? (
            <div className={styles.loading}>{error}</div>
          ) : (
            !isJoined && <div className={styles.loading}>Connecting…</div>
          )}
          <div ref={containerRef} style={{ width: "100%", height: "100%", visibility: error ? "hidden" : "visible" }} />
        </div>
      </div>
    </div>
  );
}
