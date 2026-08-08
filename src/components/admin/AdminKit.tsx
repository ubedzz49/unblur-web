"use client";

import { ReactNode } from "react";

// Small shared pieces reused across every real admin section page -- kept together so the
// visual language (pill tabs, dashed-none panels, modal chrome) stays identical everywhere
// instead of drifting per-page.

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
      <h1 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 24 }}>{title}</h1>
      {actions && <div style={{ display: "flex", gap: 10 }}>{actions}</div>}
    </div>
  );
}

export function PillTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={active === t.key}
          onClick={() => onChange(t.key)}
          style={{
            padding: "9px 16px",
            borderRadius: 100,
            border: `1px solid ${active === t.key ? "var(--violet)" : "var(--line)"}`,
            fontSize: 13,
            fontWeight: active === t.key ? 600 : 400,
            color: active === t.key ? "var(--ink-strong)" : "var(--dim)",
            background: active === t.key ? "var(--violet)" : "transparent",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 16, padding: 26, maxWidth: 400, width: "90%" }}>
        <h3 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 18, marginBottom: 10 }}>{title}</h3>
        <p style={{ color: "var(--dim)", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>{body}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{ flex: 1, padding: 11, borderRadius: 8, border: "1px solid var(--line)", background: "none", color: "var(--paper)", fontSize: 13 }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: 11,
              borderRadius: 8,
              border: "none",
              background: danger ? "var(--red)" : "var(--violet)",
              color: danger ? "#3A0E0E" : "var(--ink-strong)",
              fontWeight: 600,
              fontSize: 13,
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Panel({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: 22, ...style }}>{children}</div>
  );
}
