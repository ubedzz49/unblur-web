"use client";

import { Logo } from "@/components/Logo";
import { NAV_GROUPS, Section } from "./nav";

export function AdminSidebar({
  active,
  onSelect,
  onLogout,
}: {
  active: Section;
  onSelect: (section: Section) => void;
  onLogout: () => void;
}) {
  return (
    <nav
      aria-label="Admin"
      style={{
        background: "var(--surface)",
        borderRight: "1px solid var(--line)",
        padding: "22px 14px",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "var(--font-space-grotesk), sans-serif",
          fontWeight: 700,
          fontSize: 15,
          padding: "6px 10px 22px",
        }}
      >
        <Logo size={14} />
        unblur admin
      </div>

      <div role="tablist" style={{ flex: 1 }}>
        {NAV_GROUPS.map((group, i) => (
          <div key={group.label ?? `group-${i}`}>
            {group.label && (
              <div
                style={{
                  fontSize: 10.5,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--dim)",
                  padding: "16px 10px 8px",
                }}
              >
                {group.label}
              </div>
            )}
            {group.items.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={active === item.key}
                onClick={() => onSelect(item.key)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 10px",
                  borderRadius: 8,
                  fontSize: 13,
                  color: active === item.key ? "var(--violet)" : "var(--dim)",
                  background: active === item.key ? "var(--violet-dim)" : "transparent",
                  marginBottom: 2,
                }}
              >
                <span>{item.label}</span>
                {item.locked && (
                  <span
                    style={{
                      fontSize: 9,
                      background: "var(--surface-2)",
                      color: "var(--dim)",
                      padding: "2px 6px",
                      borderRadius: 100,
                    }}
                  >
                    Planned
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onLogout}
        style={{ fontSize: 12.5, fontWeight: 600, color: "var(--dim)", padding: "10px", textAlign: "left" }}
      >
        Log out
      </button>
    </nav>
  );
}
