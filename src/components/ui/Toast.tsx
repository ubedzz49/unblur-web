"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import styles from "./Toast.module.css";

type ToastKind = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
  leaving: boolean;
}

interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VISIBLE_MS = 3000;
const LEAVE_ANIMATION_MS = 200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, message, kind, leaving: false }]);

    setTimeout(() => {
      setToasts((current) => current.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    }, VISIBLE_MS);

    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, VISIBLE_MS + LEAVE_ANIMATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.viewport} aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            data-leaving={t.leaving}
            className={[styles.toast, t.kind === "error" ? styles.toastError : ""].join(" ")}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
