"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/lib/queries/notifications";
import { AppNotification } from "@/lib/api";
import { relativeTime } from "@/lib/relative-time";
import styles from "./NotificationBell.module.css";

// where a notification click lands -- there's no per-booking or per-doubt detail page
// besides the payment page, so booking notifications go there and everything else
// falls back to the requests hub where offers/doubts/bookings all surface
function destinationFor(notification: AppNotification): string {
  if (notification.referenceType === "booking") {
    return `/bookings/${notification.referenceId}/payment`;
  }
  return "/requests";
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const unreadCount = useUnreadNotificationCount();
  const notifications = useNotifications({ limit: 20 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function handleNotificationClick(notification: AppNotification) {
    if (!notification.readAt) {
      markRead.mutate(notification.id);
    }
    setOpen(false);
    router.push(destinationFor(notification));
  }

  const count = unreadCount.data?.count ?? 0;

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.bellButton}
        aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
        onClick={() => setOpen((v) => !v)}
      >
        🔔
        {count > 0 && <span className={styles.badge}>{count > 99 ? "99+" : count}</span>}
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="Notifications">
          <div className={styles.header}>
            <span className={styles.title}>Notifications</span>
            <button
              type="button"
              className={styles.markAll}
              disabled={markAllRead.isPending || count === 0}
              onClick={() => markAllRead.mutate()}
            >
              Mark all read
            </button>
          </div>

          {notifications.isLoading && <p className={styles.itemBody}>Loading…</p>}
          {notifications.isError && <p className={styles.itemBody}>Couldn&apos;t load notifications.</p>}
          {notifications.isSuccess && notifications.data.length === 0 && (
            <p className={styles.itemBody}>No notifications yet.</p>
          )}
          {notifications.isSuccess &&
            notifications.data.map((n) => (
              <button
                key={n.id}
                type="button"
                className={styles.item}
                data-unread={!n.readAt}
                onClick={() => handleNotificationClick(n)}
              >
                <span className={styles.itemTitle}>
                  {!n.readAt && <span className={styles.dot} aria-hidden="true" />}
                  {n.title}
                </span>
                <p className={styles.itemBody}>{n.body}</p>
                <p className={styles.itemTime}>{relativeTime(n.createdAt)}</p>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
