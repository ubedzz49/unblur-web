// Locked/planned placeholder -- styled after admin-finance-locked.html: a dashed-border
// panel explaining the real backend gap, a grayed-out preview-KPI grid, and a pointer to
// whatever real feature already covers the closest use case today.
export function LockedPage({
  title,
  intro,
  gapTitle,
  gapDetail,
  badge = "Needs backend",
  previewKpis,
  availableTitle,
  availableBody,
}: {
  title: string;
  intro: string;
  gapTitle: string;
  gapDetail: string;
  badge?: string;
  previewKpis: { value: string; label: string }[];
  availableTitle: string;
  availableBody: React.ReactNode;
}) {
  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 24, marginBottom: 8 }}>{title}</h1>
      <p style={{ color: "var(--dim)", fontSize: 14, marginBottom: 30, maxWidth: 560 }}>{intro}</p>

      <div
        style={{
          background: "var(--surface)",
          border: "1px dashed var(--line)",
          borderRadius: 16,
          padding: 40,
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        <h3 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 18, marginBottom: 10 }}>{gapTitle}</h3>
        <p style={{ color: "var(--dim)", fontSize: 13.5, maxWidth: 440, margin: "0 auto 18px" }}>{gapDetail}</p>
        <span
          style={{
            fontSize: 11,
            background: "var(--surface-2)",
            color: "var(--dim)",
            padding: "5px 12px",
            borderRadius: 100,
          }}
        >
          {badge}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${previewKpis.length}, 1fr)`,
          gap: 16,
          marginBottom: 24,
          filter: "grayscale(1)",
          opacity: 0.35,
        }}
      >
        {previewKpis.map((kpi) => (
          <div key={kpi.label} style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 12, padding: 18 }}>
            <b style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: 22, display: "block" }}>{kpi.value}</b>
            <span style={{ fontSize: 11.5, color: "var(--dim)" }}>{kpi.label}</span>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 20 }}>
        <h4 style={{ fontSize: 14, marginBottom: 10 }}>{availableTitle}</h4>
        <p style={{ color: "var(--dim)", fontSize: 13 }}>{availableBody}</p>
      </div>
    </div>
  );
}
