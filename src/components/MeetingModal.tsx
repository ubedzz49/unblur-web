"use client";

import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { useEffect, useRef, useState } from "react";
import styles from "./MeetingModal.module.css";

// Embeds Daily's Prebuilt call UI directly on our own page via an iframe call frame, instead of
// sending the user to unblur.daily.co in a new tab -- same room/joinUrl, just rendered in-place.
export function MeetingModal({ joinUrl, onClose }: { joinUrl: string; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const callFrameRef = useRef<DailyCall | null>(null);
  const [isJoined, setIsJoined] = useState(false);

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

    callFrame.on("joined-meeting", () => setIsJoined(true));
    callFrame.on("left-meeting", () => onClose());

    callFrame.join({ url: joinUrl });

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
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Leave meeting">
            ×
          </button>
        </div>
        <div className={styles.frameContainer}>
          {!isJoined && <div className={styles.loading}>Connecting…</div>}
          <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        </div>
      </div>
    </div>
  );
}
