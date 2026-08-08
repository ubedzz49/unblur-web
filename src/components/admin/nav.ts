// Shared nav model for the admin left sidebar -- one source of truth for section keys,
// labels, and which ones are locked/planned placeholders, used by both AdminSidebar and
// the admin page's section switch so the two can't drift out of sync.

export type Section =
  | "overview"
  | "users"
  | "complaints"
  | "moderation-queue"
  | "revenue"
  | "payouts"
  | "taxonomy"
  | "doubts"
  | "seminars-gds"
  | "live-ops"
  | "communications"
  | "reports"
  | "access-control"
  | "audit-log";

export interface NavItem {
  key: Section;
  label: string;
  locked?: boolean;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { key: "overview", label: "Overview" },
      { key: "users", label: "Users" },
    ],
  },
  {
    label: "Trust and safety",
    items: [
      { key: "complaints", label: "Complaints" },
      { key: "moderation-queue", label: "Moderation queue", locked: true },
    ],
  },
  {
    label: "Finance",
    items: [
      { key: "revenue", label: "Revenue dashboard", locked: true },
      { key: "payouts", label: "Payout ledger", locked: true },
    ],
  },
  {
    label: "Content",
    items: [
      { key: "taxonomy", label: "Taxonomy" },
      { key: "doubts", label: "Doubts", locked: true },
    ],
  },
  {
    label: "Sessions",
    items: [
      { key: "seminars-gds", label: "Seminars and GDs" },
      { key: "live-ops", label: "Live ops", locked: true },
    ],
  },
  {
    label: "Other",
    items: [
      { key: "communications", label: "Communications" },
      { key: "reports", label: "Reports", locked: true },
      { key: "access-control", label: "Access control" },
      { key: "audit-log", label: "Audit log" },
    ],
  },
];

export const SECTION_LABEL: Record<Section, string> = NAV_GROUPS.flatMap((g) => g.items).reduce(
  (acc, item) => ({ ...acc, [item.key]: item.label }),
  {} as Record<Section, string>,
);
