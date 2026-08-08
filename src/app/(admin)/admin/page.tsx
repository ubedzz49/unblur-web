"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { Card, Pill } from "@/components/scoreboard/kit";
import { PageHeader, PillTabs, ConfirmModal, Panel } from "@/components/admin/AdminKit";
import { LockedPage } from "@/components/admin/LockedPage";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ApiError, ComplaintOutcome, AdminRole } from "@/lib/api";
import { useIsSuperadmin } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { Section } from "@/components/admin/nav";
import {
  useAddAdminExpertise,
  useAdminAiNotes,
  useAdminComplaintRecording,
  useAdminComplaints,
  useAdminExpertiseOptions,
  useAdminGds,
  useAdminSeminars,
  useAdminUsers,
  useAdminUsersList,
  useAuditLog,
  useBlockAdminUser,
  useCancelGdAsAdmin,
  useCancelSeminarAsAdmin,
  useCreateAdminUser,
  useGatewayRoutes,
  useImportAdminExpertise,
  useRefundBookingAsAdmin,
  useRemoveAdminExpertise,
  useResolveAdminComplaint,
  useRetryAdminAiNotes,
  useRevokeAdminUser,
  useSendAdminNotification,
  useUnblockAdminUser,
  useUpdateGatewayRoutes,
} from "@/lib/queries/admin";
import shared from "../../shared.module.css";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/* --------------------------------- Overview -------------------------------- */

function OverviewSection({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const complaints = useAdminComplaints("open");
  const auditLog = useAuditLog();
  const failedAiNotes = useAdminAiNotes("failed");
  const expertise = useAdminExpertiseOptions();

  const taxonomyCount = expertise.data?.reduce((n, t) => n + t.levels.length, 0);

  const kpis: { value: string; label: string; alert?: boolean }[] = [
    { value: complaints.data ? String(complaints.data.length) : "—", label: "open complaints", alert: true },
    { value: taxonomyCount !== undefined ? String(taxonomyCount) : "—", label: "taxonomy entries" },
    { value: failedAiNotes.data ? String(failedAiNotes.data.length) : "—", label: "failed AI-notes deliveries" },
  ];

  return (
    <div>
      <PageHeader title="Overview" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 34 }}>
        {kpis.map((kpi) => (
          <div key={kpi.label} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 20 }}>
            <b
              className="num"
              style={{ fontSize: 26, display: "block", color: kpi.alert ? "var(--coral)" : "var(--violet)", marginBottom: 4 }}
            >
              {kpi.value}
            </b>
            <span style={{ fontSize: 12, color: "var(--dim)" }}>{kpi.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 30 }}>
        <Panel>
          <h3 style={{ fontSize: 14.5, marginBottom: 16 }}>Recent admin activity</h3>
          {auditLog.isLoading && <Skeleton height={120} />}
          {auditLog.isError && <p className={shared.error}>Couldn&apos;t load recent activity.</p>}
          {auditLog.data?.length === 0 && <p className={shared.muted}>No admin actions recorded yet.</p>}
          {auditLog.data?.slice(0, 10).map((entry) => (
            <div
              key={entry.id}
              style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid var(--line)", fontSize: 12.5, gap: 12 }}
            >
              <span>
                {entry.action} — {entry.targetType}:{entry.targetId.slice(0, 8)}
              </span>
              <span style={{ color: "var(--dim)", whiteSpace: "nowrap" }}>
                {entry.adminUsername}, {new Date(entry.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </Panel>

        <Panel>
          <h3 style={{ fontSize: 14.5, marginBottom: 16 }}>Quick actions</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button type="button" className="qa-btn" style={qaBtnStyle} onClick={() => onNavigate("users")}>
              Search a user
            </button>
            <button type="button" style={qaBtnStyle} onClick={() => onNavigate("complaints")}>
              Review open complaints{complaints.data ? `, ${complaints.data.length} waiting` : ""}
            </button>
            <button type="button" style={qaBtnStyle} onClick={() => onNavigate("taxonomy")}>
              Add a taxonomy entry
            </button>
            <button type="button" style={qaBtnStyle} onClick={() => onNavigate("communications")}>
              Send a message to a user
            </button>
          </div>
        </Panel>
      </div>

      <div style={{ fontSize: 13, color: "var(--dim)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "34px 0 16px" }}>
        Where this dashboard is heading
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {[
          { title: "Revenue dashboard", body: "Platform fees by day, week, and product line, plus a payout ledger with hold and failure reasons." },
          { title: "Live ops", body: "See active sessions in real time, force end a session, or silently join a GD to enforce speaking rules." },
          { title: "Growth and quality reports", body: "Time to first offer, acceptance rate, a sortable resolver leaderboard, exportable as CSV." },
        ].map((card) => (
          <div key={card.title} style={{ background: "var(--surface)", border: "1px dashed var(--line)", borderRadius: 14, padding: 18, opacity: 0.75 }}>
            <h4 style={{ fontSize: 13.5, marginBottom: 6 }}>{card.title}</h4>
            <p style={{ fontSize: 12, color: "var(--dim)" }}>{card.body}</p>
            <span
              style={{
                marginTop: 10,
                display: "inline-block",
                fontSize: 9,
                background: "var(--surface-2)",
                color: "var(--dim)",
                padding: "2px 6px",
                borderRadius: 100,
              }}
            >
              Needs backend
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const qaBtnStyle: React.CSSProperties = {
  background: "var(--surface-2)",
  border: "1px solid var(--line)",
  padding: "12px 14px",
  borderRadius: 10,
  fontSize: 13,
  textAlign: "left",
  color: "var(--paper)",
};

/* ---------------------------------- Users ---------------------------------- */

function AllUsersTab() {
  const { showToast } = useToast();
  const users = useAdminUsers();
  const blockUser = useBlockAdminUser();
  const unblockUser = useUnblockAdminUser();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "blocked">("all");
  const [pendingTarget, setPendingTarget] = useState<{ id: string; email: string; name: string; blocked: boolean } | null>(null);

  async function handleConfirm() {
    if (!pendingTarget) return;
    setBusyId(pendingTarget.id);
    try {
      if (pendingTarget.blocked) {
        await unblockUser.mutateAsync(pendingTarget.email);
        showToast("User unblocked");
      } else {
        await blockUser.mutateAsync(pendingTarget.email);
        showToast("User blocked");
      }
      setPendingTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't update that user — try again.", "error");
    } finally {
      setBusyId(null);
    }
  }

  function requestToggle(id: string, email: string | null, name: string, blocked: boolean) {
    if (!email) {
      showToast("This user has no email on file, so they can't be blocked this way.", "error");
      return;
    }
    setPendingTarget({ id, email, name, blocked });
  }

  if (users.isLoading) return <Skeleton height={200} />;
  if (users.isError) {
    return (
      <Card className="p-5">
        <h3>Couldn&apos;t load users</h3>
        <Button type="button" onClick={() => users.refetch()}>
          Try again
        </Button>
      </Card>
    );
  }

  const filtered = (users.data ?? []).filter((u) => {
    if (status === "active" && u.blockedAt) return false;
    if (status === "blocked" && !u.blockedAt) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = `${u.name ?? ""} ${u.email ?? ""} ${u.phone ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone"
          style={{ flex: 1, minWidth: 220, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: "11px 14px", color: "var(--paper)", fontSize: 13.5 }}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: "11px 14px", color: "var(--paper)", fontSize: 13.5 }}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 14, background: "var(--surface)", padding: "4px 12px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
              <th style={{ padding: 8 }}>User</th>
              <th style={{ padding: 8 }}>Phone</th>
              <th style={{ padding: 8 }}>Joined</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }} />
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: 8 }}>
                  {u.name ?? <span className={shared.muted}>—</span>}
                  <br />
                  <span style={{ color: "var(--dim)", fontSize: 11.5 }}>{u.email ?? "—"}</span>
                </td>
                <td style={{ padding: 8 }}>{u.phone ?? <span className={shared.muted}>—</span>}</td>
                <td style={{ padding: 8 }}>{formatDate(u.createdAt)}</td>
                <td style={{ padding: 8 }}>
                  <Pill tone={u.blockedAt ? "danger" : "success"}>{u.blockedAt ? "Blocked" : "Active"}</Pill>
                </td>
                <td style={{ padding: 8 }}>
                  <Button
                    type="button"
                    variant="secondary"
                    style={{ width: "auto" }}
                    disabled={busyId === u.id}
                    onClick={() => requestToggle(u.id, u.email, u.name ?? u.email ?? "this user", Boolean(u.blockedAt))}
                  >
                    {u.blockedAt ? "Unblock" : "Block"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className={shared.muted}>No users match.</p>}
      </div>

      <ConfirmModal
        open={pendingTarget !== null && !pendingTarget.blocked}
        title="Block this user"
        body={`This stops ${pendingTarget?.name} from logging in with OTP or password. Their data and content stay intact, this only locks account access, and can be reversed with unblock.`}
        confirmLabel="Block user"
        danger
        busy={busyId === pendingTarget?.id}
        onConfirm={handleConfirm}
        onCancel={() => setPendingTarget(null)}
      />
      <ConfirmModal
        open={pendingTarget !== null && pendingTarget.blocked}
        title="Unblock this user"
        body={`This restores ${pendingTarget?.name}'s ability to log in with OTP or password. Nothing else changes.`}
        confirmLabel="Unblock user"
        busy={busyId === pendingTarget?.id}
        onConfirm={handleConfirm}
        onCancel={() => setPendingTarget(null)}
      />
    </>
  );
}

// superadmin-only: manage other admin accounts (Version 9 RBAC)
function AdminAccountsTab() {
  const { showToast } = useToast();
  const isSuperadmin = useIsSuperadmin();
  const admins = useAdminUsersList();
  const createAdmin = useCreateAdminUser();
  const revokeAdmin = useRevokeAdminUser();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("admin");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingRevoke, setPendingRevoke] = useState<{ id: string; username: string } | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createAdmin.mutateAsync({ username, password, role });
      showToast(`Admin account "${username}" created`);
      setUsername("");
      setPassword("");
      setRole("admin");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't create that admin account — try again.", "error");
    }
  }

  async function handleRevoke() {
    if (!pendingRevoke) return;
    setBusyId(pendingRevoke.id);
    try {
      await revokeAdmin.mutateAsync(pendingRevoke.id);
      showToast(`Revoked ${pendingRevoke.username}'s admin access`);
      setPendingRevoke(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't revoke that admin account — try again.", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {!isSuperadmin && (
        <Panel>
          <p className={shared.muted}>
            Only superadmins can create or revoke admin accounts. You can still see the list below; the backend
            independently enforces this too.
          </p>
        </Panel>
      )}

      {isSuperadmin && (
        <Card className="p-5">
          <p style={{ fontWeight: 700, marginBottom: 12 }}>Create admin account</p>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value as AdminRole)} style={{ padding: 8, borderRadius: 4 }}>
                <option value="admin">admin</option>
                <option value="superadmin">superadmin</option>
              </select>
            </label>
            <Button type="submit" status={createAdmin.isPending ? "loading" : "idle"} loadingLabel="Creating…">
              Create
            </Button>
          </form>
        </Card>
      )}

      {admins.isLoading && <Skeleton height={120} />}
      {admins.isError && <p className={shared.error}>Couldn&apos;t load admin accounts.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {admins.data?.map((admin) => (
          <Card key={admin.id} className="p-5">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <p style={{ fontWeight: 700, marginBottom: 4 }}>{admin.username}</p>
                <Pill tone={admin.role === "superadmin" ? "gold" : "neutral"}>{admin.role}</Pill>
              </div>
              {isSuperadmin && (
                <Button
                  variant="secondary"
                  onClick={() => setPendingRevoke({ id: admin.id, username: admin.username })}
                  status={busyId === admin.id ? "loading" : "idle"}
                  loadingLabel="Revoking…"
                >
                  Revoke
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <ConfirmModal
        open={pendingRevoke !== null}
        title="Revoke admin access"
        body={`This immediately removes ${pendingRevoke?.username}'s admin login. It doesn't touch any of their past actions in the audit log, and a new admin account can be created for them again later if needed.`}
        confirmLabel="Revoke access"
        danger
        busy={busyId === pendingRevoke?.id}
        onConfirm={handleRevoke}
        onCancel={() => setPendingRevoke(null)}
      />
    </div>
  );
}

function UsersSection() {
  const [tab, setTab] = useState<"all" | "admins">("all");
  return (
    <div>
      <PageHeader title="Users" />
      <PillTabs tabs={[{ key: "all", label: "All users" }, { key: "admins", label: "Admin accounts" }]} active={tab} onChange={setTab} />
      {tab === "all" ? <AllUsersTab /> : <AdminAccountsTab />}
    </div>
  );
}

/* -------------------------------- Complaints -------------------------------- */

function ComplaintCard({ complaintStatus }: { complaintStatus: "open" | "resolved" }) {
  const { showToast } = useToast();
  const complaints = useAdminComplaints(complaintStatus);
  const resolveComplaint = useResolveAdminComplaint();
  const getRecording = useAdminComplaintRecording();
  const refundBooking = useRefundBookingAsAdmin();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openResolveId, setOpenResolveId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState<ComplaintOutcome>("upheld");

  async function handleResolve(complaintId: string) {
    setBusyId(complaintId);
    try {
      await resolveComplaint.mutateAsync({ complaintId, outcome });
      showToast(`Complaint marked ${outcome}`);
      setOpenResolveId(null);
      setNote("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't resolve that complaint — try again.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleViewRecording(complaintId: string) {
    setBusyId(complaintId);
    try {
      const { url } = await getRecording.mutateAsync(complaintId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        showToast("No recording available for this session (it may have already been deleted, or the recording window has closed).", "error");
      } else {
        showToast("Couldn't fetch the recording — try again.", "error");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleRefund(bookingId: string, complaintId: string) {
    setBusyId(complaintId);
    try {
      await refundBooking.mutateAsync(bookingId);
      showToast("Poster refunded");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't refund that booking — try again.", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (complaints.isLoading) return <Skeleton height={200} />;
  if (complaints.isError) {
    return (
      <Card className="p-5">
        <h3>Couldn&apos;t load complaints</h3>
        <Button type="button" onClick={() => complaints.refetch()}>
          Try again
        </Button>
      </Card>
    );
  }
  if (complaints.data?.length === 0) {
    return (
      <Card className="p-5">
        <p className={shared.muted}>{complaintStatus === "open" ? "No open complaints." : "No resolved complaints yet."}</p>
      </Card>
    );
  }

  return (
    <>
      {complaints.data?.map((c) => (
        <Card key={c.id} className="p-5 mb-3">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>Booking {c.bookingId.slice(0, 8)}</span>
            <Pill tone={c.status === "resolved" ? "neutral" : "live"}>
              {c.status === "resolved" ? `Resolved — ${c.outcome}` : "Open"}
            </Pill>
          </div>
          <p style={{ marginBottom: 8 }}>{c.reason}</p>
          <p className={shared.muted} style={{ marginBottom: 10, fontSize: 12 }}>
            Filed {formatDate(c.createdAt)}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button
              type="button"
              variant="secondary"
              style={{ width: "auto" }}
              disabled={busyId === c.id}
              onClick={() => handleViewRecording(c.id)}
            >
              Pull the recording
            </Button>
            {c.status === "open" && (
              <Button
                type="button"
                style={{ width: "auto" }}
                onClick={() => setOpenResolveId(openResolveId === c.id ? null : c.id)}
              >
                Resolve
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              style={{ width: "auto" }}
              disabled={busyId === c.id}
              onClick={() => handleRefund(c.bookingId, c.id)}
            >
              Refund poster
            </Button>
          </div>

          {openResolveId === c.id && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as ComplaintOutcome)}
                style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 12px", color: "var(--paper)", fontSize: 13, marginBottom: 10 }}
              >
                <option value="upheld">Uphold, refund poster and fail payout</option>
                <option value="dismissed">Dismiss, release payout as normal</option>
              </select>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Outcome note, kept in the audit log"
                rows={3}
                style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 12px", color: "var(--paper)", fontSize: 13, marginBottom: 10, fontFamily: "inherit" }}
              />
              <Button type="button" status={busyId === c.id ? "loading" : "idle"} loadingLabel="Confirming…" onClick={() => handleResolve(c.id)}>
                Confirm outcome
              </Button>
            </div>
          )}
        </Card>
      ))}
    </>
  );
}

function ComplaintsSection() {
  const [tab, setTab] = useState<"open" | "resolved">("open");
  return (
    <div>
      <PageHeader title="Complaints" />
      <PillTabs tabs={[{ key: "open", label: "Open" }, { key: "resolved", label: "Resolved" }]} active={tab} onChange={setTab} />
      <ComplaintCard complaintStatus={tab} />
    </div>
  );
}

/* --------------------------------- Taxonomy --------------------------------- */

function TaxonomySection() {
  const { showToast } = useToast();
  const options = useAdminExpertiseOptions();
  const addExpertise = useAddAdminExpertise();
  const importExpertise = useImportAdminExpertise();
  const removeExpertise = useRemoveAdminExpertise();

  const [typeTab, setTypeTab] = useState<"all" | "academic" | "competitive" | "corporate">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [levelName, setLevelName] = useState("");
  const [importJson, setImportJson] = useState("");
  const [removeBusyId, setRemoveBusyId] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<{ levelId: string; label: string } | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      await addExpertise.mutateAsync({ subjectName, levelName: levelName || undefined });
      showToast("Topic added");
      setSubjectName("");
      setLevelName("");
      setShowAdd(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't add that topic — try again.", "error");
    }
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    let nodes: { subjectName: string; levelName?: string }[];
    try {
      nodes = JSON.parse(importJson);
      if (!Array.isArray(nodes)) throw new Error("not an array");
    } catch {
      showToast('Invalid JSON — expected an array like [{"subjectName": "...", "levelName": "..."}]', "error");
      return;
    }
    try {
      const result = await importExpertise.mutateAsync(nodes);
      showToast(`Imported ${result.created.length} topic(s)${result.failed.length ? `, ${result.failed.length} failed` : ""}`);
      setImportJson("");
      setShowImport(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Import failed — try again.", "error");
    }
  }

  async function handleRemove() {
    if (!pendingRemove) return;
    setRemoveBusyId(pendingRemove.levelId);
    try {
      await removeExpertise.mutateAsync(pendingRemove.levelId);
      showToast("Topic removed");
      setPendingRemove(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't remove that topic — try again.", "error");
    } finally {
      setRemoveBusyId(null);
    }
  }

  const rows = (options.data ?? []).flatMap((type) =>
    type.levels.map((level) => ({ type, level })),
  ).filter(({ type }) => typeTab === "all" || type.type.toLowerCase() === typeTab);

  return (
    <div>
      <PageHeader
        title="Taxonomy"
        actions={
          <>
            <Button type="button" variant="secondary" style={{ width: "auto" }} onClick={() => setShowImport(true)}>
              Bulk import JSON
            </Button>
            <Button type="button" style={{ width: "auto" }} onClick={() => setShowAdd(true)}>
              Add entry
            </Button>
          </>
        }
      />

      <PillTabs
        tabs={[
          { key: "all", label: "All" },
          { key: "academic", label: "Academic" },
          { key: "competitive", label: "Competitive" },
          { key: "corporate", label: "Corporate" },
        ]}
        active={typeTab}
        onChange={setTypeTab}
      />

      {options.isLoading && <Skeleton height={200} />}
      {options.isError && <p className={shared.error}>Couldn&apos;t load taxonomy.</p>}
      {options.isSuccess && (
        <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 14, background: "var(--surface)", padding: "4px 12px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
                <th style={{ padding: 8 }}>Subject</th>
                <th style={{ padding: 8 }}>Category</th>
                <th style={{ padding: 8 }}>Level</th>
                <th style={{ padding: 8 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ type, level }) => (
                <tr key={level.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: 8 }}>{type.name}</td>
                  <td style={{ padding: 8 }} className={shared.muted}>
                    {type.type}
                  </td>
                  <td style={{ padding: 8 }}>{level.name}</td>
                  <td style={{ padding: 8 }}>
                    <Button
                      type="button"
                      variant="secondary"
                      style={{ width: "auto" }}
                      disabled={removeBusyId === level.id}
                      onClick={() => setPendingRemove({ levelId: level.id, label: `${type.name} — ${level.name}` })}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className={shared.muted}>No entries in this category.</p>}
        </div>
      )}

      {showAdd && (
        <ConfirmModalShell title="Add a taxonomy entry" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd}>
            <input
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="Subject, exam, or skill, e.g. Economics"
              required
              style={modalInputStyle}
            />
            <input
              value={levelName}
              onChange={(e) => setLevelName(e.target.value)}
              placeholder="Level, e.g. Class 11, or Quant, or Mid"
              style={modalInputStyle}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setShowAdd(false)} style={modalCancelStyle}>
                Cancel
              </button>
              <button type="submit" disabled={addExpertise.isPending} style={modalConfirmStyle()}>
                {addExpertise.isPending ? "Adding…" : "Add entry"}
              </button>
            </div>
          </form>
        </ConfirmModalShell>
      )}

      {showImport && (
        <ConfirmModalShell title="Bulk import via JSON" onClose={() => setShowImport(false)}>
          <form onSubmit={handleImport}>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='[{"subjectName": "Marine Biology", "levelName": "Intro"}]'
              rows={6}
              style={{ ...modalInputStyle, fontFamily: "monospace", fontSize: 12 }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setShowImport(false)} style={modalCancelStyle}>
                Cancel
              </button>
              <button type="submit" disabled={importExpertise.isPending} style={modalConfirmStyle()}>
                {importExpertise.isPending ? "Importing…" : "Import"}
              </button>
            </div>
          </form>
        </ConfirmModalShell>
      )}

      <ConfirmModal
        open={pendingRemove !== null}
        title="Remove this entry"
        body={`This removes "${pendingRemove?.label}" and untags it from every user who currently has it, this cannot be undone. If this is a duplicate of another entry, consider that those users will lose the tag entirely rather than being moved.`}
        confirmLabel="Remove and untag everyone"
        danger
        busy={removeBusyId === pendingRemove?.levelId}
        onConfirm={handleRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
}

const modalInputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: "11px 13px",
  color: "var(--paper)",
  fontSize: 13.5,
  marginBottom: 12,
};
const modalCancelStyle: React.CSSProperties = {
  flex: 1,
  padding: 11,
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "none",
  color: "var(--paper)",
  fontSize: 13,
};
function modalConfirmStyle(): React.CSSProperties {
  return { flex: 1, padding: 11, borderRadius: 8, border: "none", background: "var(--violet)", color: "var(--ink-strong)", fontWeight: 600, fontSize: 13 };
}

function ConfirmModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={onClose}>
      <div
        style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 16, padding: 26, maxWidth: 420, width: "90%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 18, marginBottom: 16 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

/* ----------------------------- Seminars and GDs ----------------------------- */

function CancelReferenceButton({ status, busy, onCancel }: { status: string; busy: boolean; onCancel: () => void }) {
  if (status === "completed" || status === "cancelled") return null;
  return (
    <Button variant="secondary" onClick={onCancel} status={busy ? "loading" : "idle"} loadingLabel="Cancelling…">
      Cancel
    </Button>
  );
}

function SeminarsTab() {
  const { showToast } = useToast();
  const seminars = useAdminSeminars();
  const cancelSeminar = useCancelSeminarAsAdmin();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ id: string; title: string } | null>(null);

  async function handleCancel() {
    if (!pending) return;
    setBusyId(pending.id);
    try {
      await cancelSeminar.mutateAsync(pending.id);
      showToast("Seminar cancelled, every registrant refunded");
      setPending(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't cancel that seminar — try again.", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (seminars.isLoading) return <Skeleton height={200} />;
  if (seminars.isError) return <p className={shared.error}>Couldn&apos;t load seminars.</p>;

  return (
    <>
      <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 14, background: "var(--surface)", padding: "4px 12px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
              <th style={{ padding: 8 }}>Title</th>
              <th style={{ padding: 8 }}>Scheduled</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }} />
            </tr>
          </thead>
          <tbody>
            {seminars.data?.map((seminar) => (
              <tr key={seminar.id} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: 8, fontWeight: 700 }}>{seminar.title}</td>
                <td style={{ padding: 8 }}>{new Date(seminar.scheduledAt).toLocaleString()}</td>
                <td style={{ padding: 8 }}>
                  <Pill tone={seminar.status === "cancelled" ? "danger" : seminar.status === "completed" ? "success" : "outline"}>
                    {seminar.status}
                  </Pill>
                </td>
                <td style={{ padding: 8 }}>
                  <CancelReferenceButton
                    status={seminar.status}
                    busy={busyId === seminar.id}
                    onCancel={() => setPending({ id: seminar.id, title: seminar.title })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {seminars.data?.length === 0 && <p className={shared.muted}>No seminars yet.</p>}
      </div>

      <ConfirmModal
        open={pending !== null}
        title="Cancel and refund everyone"
        body={`This is all or nothing, cancelling "${pending?.title}" refunds every registrant in full immediately. There is no partial refund option, and this cannot be reversed from here.`}
        confirmLabel="Cancel and refund all"
        cancelLabel="Go back"
        danger
        busy={busyId === pending?.id}
        onConfirm={handleCancel}
        onCancel={() => setPending(null)}
      />
    </>
  );
}

function GdsTab() {
  const { showToast } = useToast();
  const gds = useAdminGds();
  const cancelGd = useCancelGdAsAdmin();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ id: string; topic: string } | null>(null);

  async function handleCancel() {
    if (!pending) return;
    setBusyId(pending.id);
    try {
      await cancelGd.mutateAsync(pending.id);
      showToast("GD cancelled, organizer and every participant refunded");
      setPending(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't cancel that gd — try again.", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (gds.isLoading) return <Skeleton height={200} />;
  if (gds.isError) return <p className={shared.error}>Couldn&apos;t load GDs.</p>;

  return (
    <>
      <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 14, background: "var(--surface)", padding: "4px 12px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
              <th style={{ padding: 8 }}>Topic</th>
              <th style={{ padding: 8 }}>Scheduled</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }} />
            </tr>
          </thead>
          <tbody>
            {gds.data?.map((gd) => (
              <tr key={gd.id} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: 8, fontWeight: 700 }}>{gd.topic}</td>
                <td style={{ padding: 8 }}>{new Date(gd.scheduledAt).toLocaleString()}</td>
                <td style={{ padding: 8 }}>
                  <Pill tone={gd.status === "cancelled" ? "danger" : gd.status === "completed" ? "success" : "outline"}>{gd.status}</Pill>
                </td>
                <td style={{ padding: 8 }}>
                  <CancelReferenceButton status={gd.status} busy={busyId === gd.id} onCancel={() => setPending({ id: gd.id, topic: gd.topic })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {gds.data?.length === 0 && <p className={shared.muted}>No GDs yet.</p>}
      </div>

      <ConfirmModal
        open={pending !== null}
        title="Cancel and refund everyone"
        body={`This is all or nothing, cancelling "${pending?.topic}" refunds the organizer and every participant in full immediately. There is no partial refund option, and this cannot be reversed from here.`}
        confirmLabel="Cancel and refund all"
        cancelLabel="Go back"
        danger
        busy={busyId === pending?.id}
        onConfirm={handleCancel}
        onCancel={() => setPending(null)}
      />
    </>
  );
}

function SeminarsGdsSection() {
  const [tab, setTab] = useState<"seminars" | "gds">("seminars");
  return (
    <div>
      <PageHeader title="Seminars and group discussions" />
      <PillTabs tabs={[{ key: "seminars", label: "Seminars" }, { key: "gds", label: "Group discussions" }]} active={tab} onChange={setTab} />
      {tab === "seminars" ? <SeminarsTab /> : <GdsTab />}
    </div>
  );
}

/* ------------------------------- Communications ------------------------------ */

function NotificationsTab() {
  const { showToast } = useToast();
  const sendNotification = useSendAdminNotification();
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await sendNotification.mutateAsync({ userId, title, body: body || undefined });
      showToast("Notification sent");
      setUserId("");
      setTitle("");
      setBody("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't send that notification — try again.", "error");
    }
  }

  return (
    <Panel style={{ maxWidth: 480 }}>
      <form onSubmit={handleSubmit}>
        <p className={shared.muted} style={{ marginBottom: 4 }}>User id</p>
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="user uuid"
          required
          style={modalInputStyle}
        />
        <p className={shared.muted} style={{ marginBottom: 4 }}>Title</p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Notification title"
          required
          style={modalInputStyle}
        />
        <p className={shared.muted} style={{ marginBottom: 4 }}>Body (optional)</p>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          style={{ ...modalInputStyle, fontFamily: "inherit" }}
        />
        <Button type="submit" status={sendNotification.isPending ? "loading" : "idle"} loadingLabel="Sending…">
          Send notification
        </Button>
      </form>
    </Panel>
  );
}

function AiNotesTab() {
  const { showToast } = useToast();
  // only failed deliveries are actionable here -- support doesn't need to browse
  // pending/generated/sent rows, just the ones that need a manual retry
  const deliveries = useAdminAiNotes("failed");
  const retryDelivery = useRetryAdminAiNotes();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleRetry(id: string) {
    setBusyId(id);
    try {
      await retryDelivery.mutateAsync(id);
      showToast("Delivery re-queued");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't retry that delivery — try again.", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (deliveries.isLoading) return <Skeleton height={200} />;
  if (deliveries.isError) {
    return (
      <Card className="p-5">
        <h3>Couldn&apos;t load AI notes deliveries</h3>
        <Button type="button" onClick={() => deliveries.refetch()}>
          Try again
        </Button>
      </Card>
    );
  }
  if (deliveries.data?.length === 0) {
    return (
      <Card className="p-5">
        <p className={shared.muted}>No failed deliveries.</p>
      </Card>
    );
  }

  return (
    <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 14, background: "var(--surface)", padding: "4px 12px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
            <th style={{ padding: 8 }}>Reference</th>
            <th style={{ padding: 8 }}>User</th>
            <th style={{ padding: 8 }}>Created</th>
            <th style={{ padding: 8 }} />
          </tr>
        </thead>
        <tbody>
          {deliveries.data?.map((d) => (
            <tr key={d.id} style={{ borderBottom: "1px solid var(--line)" }}>
              <td style={{ padding: 8 }}>
                {d.referenceType} {d.referenceId.slice(0, 8)}
              </td>
              <td style={{ padding: 8 }}>{d.userId.slice(0, 8)}</td>
              <td style={{ padding: 8 }}>{formatDate(d.createdAt)}</td>
              <td style={{ padding: 8 }}>
                <Button type="button" variant="secondary" style={{ width: "auto" }} disabled={busyId === d.id} onClick={() => handleRetry(d.id)}>
                  Retry
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CommunicationsSection() {
  const [tab, setTab] = useState<"send" | "aiNotes">("send");
  return (
    <div>
      <PageHeader title="Communications" />
      <PillTabs
        tabs={[{ key: "send", label: "Send notification" }, { key: "aiNotes", label: "AI notes retries" }]}
        active={tab}
        onChange={setTab}
      />
      {tab === "send" ? <NotificationsTab /> : <AiNotesTab />}
    </div>
  );
}

/* ------------------------------- Access control ------------------------------ */

function GatewaySubSection() {
  const { showToast } = useToast();
  const routes = useGatewayRoutes();
  const updateRoutes = useUpdateGatewayRoutes();
  const [draft, setDraft] = useState<string | null>(null);

  const currentJson = draft ?? (routes.data ? JSON.stringify(routes.data, null, 2) : "");

  async function handleSave() {
    try {
      const parsed = JSON.parse(currentJson);
      await updateRoutes.mutateAsync(parsed);
      showToast("Gateway routing table updated");
      setDraft(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't update the routing table — check the JSON.", "error");
    }
  }

  if (routes.isLoading) return <Skeleton height={120} />;
  if (routes.isError) return <p className={shared.error}>Couldn&apos;t load the gateway&apos;s routing table.</p>;

  return (
    <Card className="p-5">
      <p style={{ fontWeight: 700, marginBottom: 8 }}>Gateway routing table</p>
      <p className={shared.muted} style={{ marginBottom: 12 }}>
        Live only -- a change here doesn&apos;t survive the gateway restarting (that still comes from the ECS task
        definition&apos;s ROUTES env var). Use this for a temporary operational change, not a permanent one.
      </p>
      <textarea value={currentJson} onChange={(e) => setDraft(e.target.value)} rows={14} style={{ ...modalInputStyle, fontFamily: "monospace" }} />
      <Button onClick={handleSave} status={updateRoutes.isPending ? "loading" : "idle"} loadingLabel="Saving…">
        Save
      </Button>
    </Card>
  );
}

function AccessControlSection({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const isSuperadmin = useIsSuperadmin();
  return (
    <div>
      <PageHeader title="Access control" />
      <Panel style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 14.5, marginBottom: 10 }}>Admin accounts</h3>
        <p className={shared.muted} style={{ marginBottom: 14 }}>
          Creating and revoking admin accounts lives on the Users page&apos;s &quot;Admin accounts&quot; tab so there&apos;s
          one place to manage every account, human or admin.
        </p>
        <Button type="button" variant="secondary" style={{ width: "auto" }} onClick={() => onNavigate("users")}>
          Go to Users → Admin accounts
        </Button>
      </Panel>

      {isSuperadmin ? (
        <div>
          <div style={{ fontSize: 13, color: "var(--dim)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>
            Infra, not for daily use
          </div>
          <GatewaySubSection />
        </div>
      ) : (
        <Panel>
          <p className={shared.muted}>The gateway&apos;s live routing table is a superadmin-only, infrequent operational tool. It isn&apos;t shown here for your role.</p>
        </Panel>
      )}
    </div>
  );
}

/* --------------------------------- Audit log --------------------------------- */

function AuditLogSection() {
  const auditLog = useAuditLog();

  return (
    <div>
      <PageHeader title="Audit log" />
      {auditLog.isLoading && <Skeleton height={200} />}
      {auditLog.isError && <p className={shared.error}>Couldn&apos;t load the audit log.</p>}
      {auditLog.isSuccess && (
        <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 14, background: "var(--surface)", padding: "4px 12px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
                <th style={{ padding: 8 }}>When</th>
                <th style={{ padding: 8 }}>Admin</th>
                <th style={{ padding: 8 }}>Action</th>
                <th style={{ padding: 8 }}>Target</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.data?.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: 8 }}>{new Date(entry.createdAt).toLocaleString()}</td>
                  <td style={{ padding: 8 }}>{entry.adminUsername}</td>
                  <td style={{ padding: 8 }}>{entry.action}</td>
                  <td style={{ padding: 8 }}>
                    {entry.targetType}:{entry.targetId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {auditLog.data?.length === 0 && <p className={shared.muted}>No admin actions recorded yet.</p>}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- Page shell -------------------------------- */

function SectionContent({ section, setSection }: { section: Section; setSection: (s: Section) => void }) {
  switch (section) {
    case "overview":
      return <OverviewSection onNavigate={setSection} />;
    case "users":
      return <UsersSection />;
    case "complaints":
      return <ComplaintsSection />;
    case "taxonomy":
      return <TaxonomySection />;
    case "seminars-gds":
      return <SeminarsGdsSection />;
    case "communications":
      return <CommunicationsSection />;
    case "access-control":
      return <AccessControlSection onNavigate={setSection} />;
    case "audit-log":
      return <AuditLogSection />;
    case "moderation-queue":
      return (
        <LockedPage
          title="Moderation queue"
          intro="This section is reserved in the navigation so it slots in without a redesign once the backend supports it. It is not built against real data yet."
          gapTitle="Waiting on a moderation signal"
          gapDetail="Complaints already flow through Trust and safety once a user reports something, but there is no automated flagging of doubt posts or chat content before that happens. A moderation queue needs a detection signal (keyword rules or a model) feeding a review list, and that pipeline doesn't exist yet."
          previewKpis={[
            { value: "—", label: "flagged today" },
            { value: "—", label: "auto-hidden posts" },
            { value: "—", label: "appeals pending" },
          ]}
          availableTitle="What you can already do today"
          availableBody="User-reported issues on a specific booking already reach you through Trust and safety, Complaints. That covers the reactive case; this page is for proactive, automated detection across all content."
        />
      );
    case "revenue":
      return (
        <LockedPage
          title="Revenue dashboard"
          intro="This section is reserved in the navigation so it slots in without a redesign once the backend supports it. It is not built against real data yet."
          gapTitle="Waiting on backend aggregation"
          gapDetail="Individual payment and payout records already exist per booking, there is currently no aggregate view across them by day, product line, or reason. Someone needs to confirm this is being built before this page goes further than a shape."
          previewKpis={[
            { value: "₹—", label: "platform fees this month" },
            { value: "₹—", label: "held or withheld payouts" },
            { value: "₹—", label: "total refunded this month" },
          ]}
          availableTitle="What you can already do today"
          availableBody="Per-booking refunds tied to a complaint live under Trust and safety, Complaints. That covers the individual correction case, this page is for the aggregate view across all of them at once."
        />
      );
    case "payouts":
      return (
        <LockedPage
          title="Payout ledger"
          intro="This section is reserved in the navigation so it slots in without a redesign once the backend supports it. It is not built against real data yet."
          gapTitle="Waiting on a ledger view"
          gapDetail="Payout records exist per booking in the payments service, but there is no endpoint that lists payout runs, holds, or failure reasons together in one place. That aggregation doesn't exist yet, so there's nothing real to show here."
          previewKpis={[
            { value: "—", label: "pending payouts" },
            { value: "—", label: "held payouts" },
            { value: "—", label: "failed payouts this week" },
          ]}
          availableTitle="What you can already do today"
          availableBody="A single booking's payout can already be corrected by refunding it from Trust and safety, Complaints. This page is for seeing every payout's state at once, not fixing one at a time."
        />
      );
    case "doubts":
      return (
        <LockedPage
          title="Doubts"
          intro="This section is reserved in the navigation so it slots in without a redesign once the backend supports it. It is not built against real data yet."
          gapTitle="Waiting on an admin-facing doubts endpoint"
          gapDetail="Doubts students post already live in the doubts service, but there is no admin endpoint to list, search, or remove one directly. Today, a problematic doubt only gets handled indirectly, through a complaint or a support request."
          previewKpis={[
            { value: "—", label: "doubts posted today" },
            { value: "—", label: "doubts removed this week" },
            { value: "—", label: "reports on doubts" },
          ]}
          availableTitle="What you can already do today"
          availableBody="The subjects and levels a doubt can be tagged with are managed under Content, Taxonomy. That's the closest existing control until doubts get a direct admin view."
        />
      );
    case "live-ops":
      return (
        <LockedPage
          title="Live ops"
          intro="This section is reserved in the navigation so it slots in without a redesign once the backend supports it. It is not built against real data yet."
          gapTitle="Waiting on a real-time session feed"
          gapDetail="Session state for in-progress bookings and GDs lives in their respective services already, but there is no real-time admin feed of what's live right now, and no force-end or silent-join action wired up to it."
          previewKpis={[
            { value: "—", label: "live sessions right now" },
            { value: "—", label: "live GDs right now" },
            { value: "—", label: "resolvers currently active" },
          ]}
          availableTitle="What you can already do today"
          availableBody="Scheduled (not-yet-live) seminars and GDs can already be cancelled with a full refund from Sessions, Seminars and GDs. This page is for sessions that are already in progress."
        />
      );
    case "reports":
      return (
        <LockedPage
          title="Growth and quality reports"
          intro="This section is reserved in the navigation so it slots in without a redesign once the backend supports it. It is not built against real data yet."
          gapTitle="Waiting on a reporting job"
          gapDetail="Time to first offer, acceptance rate, and a resolver leaderboard are cross-booking aggregates that need a scheduled reporting job, not a live query on demand. That job doesn't run today, so there's no real data to source these numbers from."
          previewKpis={[
            { value: "—", label: "avg time to first offer" },
            { value: "—", label: "acceptance rate" },
            { value: "—", label: "top resolver score" },
          ]}
          availableTitle="What you can already do today"
          availableBody="Every admin action taken so far is already visible, one row at a time, under Other, Audit log. It's not a report, but it's real and current."
        />
      );
    default:
      return null;
  }
}

export default function AdminDashboardPage() {
  const [section, setSection] = useState<Section>("overview");
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "230px 1fr", minHeight: "100vh" }}>
      <AdminSidebar
        active={section}
        onSelect={setSection}
        onLogout={() => {
          logout();
          router.push("/login");
        }}
      />
      <div style={{ padding: "30px 36px 80px" }}>
        <SectionContent section={section} setSection={setSection} />
      </div>
    </div>
  );
}
