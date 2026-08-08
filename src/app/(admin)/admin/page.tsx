"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { Card, Pill } from "@/components/scoreboard/kit";
import { ApiError, ComplaintOutcome, AdminRole } from "@/lib/api";
import { useIsSuperadmin } from "@/lib/auth";
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

type Tab = "users" | "complaints" | "notifications" | "expertise" | "aiNotes" | "seminars" | "gds" | "rbac" | "auditLog" | "gateway";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function UsersTab() {
  const { showToast } = useToast();
  const users = useAdminUsers();
  const blockUser = useBlockAdminUser();
  const unblockUser = useUnblockAdminUser();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleToggleBlock(email: string | null, id: string, blocked: boolean) {
    if (!email) {
      showToast("This user has no email on file, so they can't be blocked this way.", "error");
      return;
    }
    setBusyId(id);
    try {
      if (blocked) {
        await unblockUser.mutateAsync(email);
        showToast("User unblocked");
      } else {
        await blockUser.mutateAsync(email);
        showToast("User blocked");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't update that user — try again.", "error");
    } finally {
      setBusyId(null);
    }
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

  return (
    <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 14, background: "var(--surface)", padding: "4px 12px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
            <th style={{ padding: 8 }}>Name</th>
            <th style={{ padding: 8 }}>Email</th>
            <th style={{ padding: 8 }}>Phone</th>
            <th style={{ padding: 8 }}>Joined</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }} />
          </tr>
        </thead>
        <tbody>
          {users.data?.map((u) => (
            <tr key={u.id} style={{ borderBottom: "1px solid var(--line)" }}>
              <td style={{ padding: 8 }}>{u.name ?? <span className={shared.muted}>—</span>}</td>
              <td style={{ padding: 8 }}>{u.email ?? <span className={shared.muted}>—</span>}</td>
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
                  onClick={() => handleToggleBlock(u.email, u.id, Boolean(u.blockedAt))}
                >
                  {u.blockedAt ? "Unblock" : "Block"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.data?.length === 0 && <p className={shared.muted}>No users yet.</p>}
    </div>
  );
}

function ComplaintsTab() {
  const { showToast } = useToast();
  const complaints = useAdminComplaints();
  const resolveComplaint = useResolveAdminComplaint();
  const getRecording = useAdminComplaintRecording();
  const refundBooking = useRefundBookingAsAdmin();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleResolve(complaintId: string, outcome: ComplaintOutcome) {
    setBusyId(complaintId);
    try {
      await resolveComplaint.mutateAsync({ complaintId, outcome });
      showToast(`Complaint marked ${outcome}`);
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
        showToast("No recording available for this session (it may have already been deleted).", "error");
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
        <p className={shared.muted}>No complaints filed yet.</p>
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
              View recording
            </Button>
            {c.status === "open" && (
              <>
                <Button
                  type="button"
                  style={{ width: "auto" }}
                  disabled={busyId === c.id}
                  onClick={() => handleResolve(c.id, "upheld")}
                >
                  Mark upheld
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  style={{ width: "auto" }}
                  disabled={busyId === c.id}
                  onClick={() => handleResolve(c.id, "dismissed")}
                >
                  Dismiss
                </Button>
              </>
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
        </Card>
      ))}
    </>
  );
}

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
    <Card className="p-5 max-w-[480px]">
      <form onSubmit={handleSubmit}>
        <p className={shared.muted} style={{ marginBottom: 4 }}>User id</p>
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="user uuid"
          required
          style={{ width: "100%", marginBottom: 12, fontSize: 13, padding: 8 }}
        />
        <p className={shared.muted} style={{ marginBottom: 4 }}>Title</p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Notification title"
          required
          style={{ width: "100%", marginBottom: 12, fontSize: 13, padding: 8 }}
        />
        <p className={shared.muted} style={{ marginBottom: 4 }}>Body (optional)</p>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          style={{ width: "100%", marginBottom: 12, fontFamily: "inherit", fontSize: 13, padding: 8 }}
        />
        <Button type="submit" status={sendNotification.isPending ? "loading" : "idle"} loadingLabel="Sending…">
          Send notification
        </Button>
      </form>
    </Card>
  );
}

function ExpertiseTab() {
  const { showToast } = useToast();
  const options = useAdminExpertiseOptions();
  const addExpertise = useAddAdminExpertise();
  const importExpertise = useImportAdminExpertise();
  const removeExpertise = useRemoveAdminExpertise();

  const [subjectName, setSubjectName] = useState("");
  const [levelName, setLevelName] = useState("");
  const [importJson, setImportJson] = useState("");
  const [removeBusyId, setRemoveBusyId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      await addExpertise.mutateAsync({ subjectName, levelName: levelName || undefined });
      showToast("Topic added");
      setSubjectName("");
      setLevelName("");
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
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Import failed — try again.", "error");
    }
  }

  async function handleRemove(levelId: string) {
    setRemoveBusyId(levelId);
    try {
      await removeExpertise.mutateAsync(levelId);
      showToast("Topic removed");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't remove that topic — try again.", "error");
    } finally {
      setRemoveBusyId(null);
    }
  }

  return (
    <>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        <Card className="p-5 max-w-[380px] min-w-[320px] flex-1">
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Add a topic manually</h3>
          <form onSubmit={handleAdd}>
            <input
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="Subject name"
              required
              style={{ width: "100%", marginBottom: 8, fontSize: 13, padding: 8 }}
            />
            <input
              value={levelName}
              onChange={(e) => setLevelName(e.target.value)}
              placeholder="Level name (optional)"
              style={{ width: "100%", marginBottom: 8, fontSize: 13, padding: 8 }}
            />
            <Button type="submit" status={addExpertise.isPending ? "loading" : "idle"} loadingLabel="Adding…">
              Add topic
            </Button>
          </form>
        </Card>

        <Card className="p-5 max-w-[380px] min-w-[320px] flex-1">
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Bulk import via JSON</h3>
          <form onSubmit={handleImport}>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='[{"subjectName": "Marine Biology", "levelName": "Intro"}]'
              rows={4}
              style={{ width: "100%", marginBottom: 8, fontFamily: "monospace", fontSize: 12, padding: 8 }}
            />
            <Button type="submit" status={importExpertise.isPending ? "loading" : "idle"} loadingLabel="Importing…">
              Import
            </Button>
          </form>
        </Card>
      </div>

      {options.isLoading && <Skeleton height={200} />}
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
              {options.data.flatMap((type) =>
                type.levels.map((level) => (
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
                        onClick={() => handleRemove(level.id)}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
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
                <Button
                  type="button"
                  variant="secondary"
                  style={{ width: "auto" }}
                  disabled={busyId === d.id}
                  onClick={() => handleRetry(d.id)}
                >
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

// shared by both tabs below -- a completed/cancelled session's cancel button is a no-op, so
// only "scheduled"/"live" ones get one
function CancelReferenceButton({
  status,
  busy,
  onCancel,
}: {
  status: string;
  busy: boolean;
  onCancel: () => void;
}) {
  if (status === "completed" || status === "cancelled") return null;
  return (
    <Button variant="secondary" onClick={onCancel} status={busy ? "loading" : "idle"} loadingLabel="Cancelling…">
      Cancel &amp; refund
    </Button>
  );
}

function SeminarsTab() {
  const { showToast } = useToast();
  const seminars = useAdminSeminars();
  const cancelSeminar = useCancelSeminarAsAdmin();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleCancel(id: string) {
    setBusyId(id);
    try {
      await cancelSeminar.mutateAsync(id);
      showToast("Seminar cancelled, every registrant refunded");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't cancel that seminar — try again.", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (seminars.isLoading) return <Skeleton />;
  if (seminars.isError) return <p className={shared.error}>Couldn&apos;t load seminars.</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {seminars.data?.length === 0 && <p className={shared.muted}>No seminars yet.</p>}
      {seminars.data?.map((seminar) => (
        <Card key={seminar.id} className="p-5">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <p style={{ fontWeight: 700 }}>{seminar.title}</p>
              <p className={shared.muted}>
                {new Date(seminar.scheduledAt).toLocaleString()}{" "}
                <Pill tone={seminar.status === "cancelled" ? "danger" : seminar.status === "completed" ? "success" : "outline"}>
                  {seminar.status}
                </Pill>
              </p>
            </div>
            <CancelReferenceButton status={seminar.status} busy={busyId === seminar.id} onCancel={() => handleCancel(seminar.id)} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function GdsTab() {
  const { showToast } = useToast();
  const gds = useAdminGds();
  const cancelGd = useCancelGdAsAdmin();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleCancel(id: string) {
    setBusyId(id);
    try {
      await cancelGd.mutateAsync(id);
      showToast("GD cancelled, organizer and every participant refunded");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't cancel that gd — try again.", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (gds.isLoading) return <Skeleton />;
  if (gds.isError) return <p className={shared.error}>Couldn&apos;t load GDs.</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {gds.data?.length === 0 && <p className={shared.muted}>No GDs yet.</p>}
      {gds.data?.map((gd) => (
        <Card key={gd.id} className="p-5">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <p style={{ fontWeight: 700 }}>{gd.topic}</p>
              <p className={shared.muted}>
                {new Date(gd.scheduledAt).toLocaleString()}{" "}
                <Pill tone={gd.status === "cancelled" ? "danger" : gd.status === "completed" ? "success" : "outline"}>
                  {gd.status}
                </Pill>
              </p>
            </div>
            <CancelReferenceButton status={gd.status} busy={busyId === gd.id} onCancel={() => handleCancel(gd.id)} />
          </div>
        </Card>
      ))}
    </div>
  );
}

// superadmin-only: manage other admin accounts (Version 9 RBAC)
function RbacTab() {
  const { showToast } = useToast();
  const admins = useAdminUsersList();
  const createAdmin = useCreateAdminUser();
  const revokeAdmin = useRevokeAdminUser();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("admin");
  const [busyId, setBusyId] = useState<string | null>(null);

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

  async function handleRevoke(id: string, username: string) {
    setBusyId(id);
    try {
      await revokeAdmin.mutateAsync(id);
      showToast(`Revoked ${username}'s admin access`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't revoke that admin account — try again.", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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

      {admins.isLoading && <Skeleton />}
      {admins.isError && <p className={shared.error}>Couldn&apos;t load admin accounts.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {admins.data?.map((admin) => (
          <Card key={admin.id} className="p-5">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <p style={{ fontWeight: 700, marginBottom: 4 }}>{admin.username}</p>
                <Pill tone={admin.role === "superadmin" ? "gold" : "neutral"}>{admin.role}</Pill>
              </div>
              <Button
                variant="secondary"
                onClick={() => handleRevoke(admin.id, admin.username)}
                status={busyId === admin.id ? "loading" : "idle"}
                loadingLabel="Revoking…"
              >
                Revoke
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AuditLogTab() {
  const auditLog = useAuditLog();

  if (auditLog.isLoading) return <Skeleton />;
  if (auditLog.isError) return <p className={shared.error}>Couldn&apos;t load the audit log.</p>;

  return (
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
  );
}

// superadmin-only: view/replace the gateway's live routing table (Version 9's admin/config
// service for gateway routes). Textarea-based JSON editor -- deliberately simple, this is an
// infrequent, high-stakes operational action, not a polished everyday screen.
function GatewayTab() {
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

  if (routes.isLoading) return <Skeleton />;
  if (routes.isError) return <p className={shared.error}>Couldn&apos;t load the gateway&apos;s routing table.</p>;

  return (
    <Card className="p-5">
      <p style={{ fontWeight: 700, marginBottom: 8 }}>Gateway routing table</p>
      <p className={shared.muted} style={{ marginBottom: 12 }}>
        Live only -- a change here doesn&apos;t survive the gateway restarting (that still comes from the ECS task
        definition&apos;s ROUTES env var). Use this for a temporary operational change, not a permanent one.
      </p>
      <textarea
        value={currentJson}
        onChange={(e) => setDraft(e.target.value)}
        rows={16}
        style={{ width: "100%", fontFamily: "monospace", fontSize: 13, padding: 8 }}
      />
      <div style={{ marginTop: 12 }}>
        <Button onClick={handleSave} status={updateRoutes.isPending ? "loading" : "idle"} loadingLabel="Saving…">
          Save
        </Button>
      </div>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [tab, setTab] = useState<Tab>("users");
  const isSuperadmin = useIsSuperadmin();

  const tabs: { key: Tab; label: string }[] = [
    { key: "users", label: "Users" },
    { key: "complaints", label: "Complaints" },
    { key: "notifications", label: "Notifications" },
    { key: "expertise", label: "Topics" },
    { key: "aiNotes", label: "AI Notes" },
    { key: "seminars", label: "Seminars" },
    { key: "gds", label: "GDs" },
    { key: "auditLog", label: "Audit Log" },
    // RBAC and gateway management are superadmin-only -- the backend independently enforces
    // this too, hiding the tabs is just so a plain admin isn't shown an action they'll get a
    // 403 on
    ...(isSuperadmin ? [{ key: "rbac" as const, label: "Admins" }, { key: "gateway" as const, label: "Gateway" }] : []),
  ];

  return (
    <section style={{ padding: "16px 0" }}>
      <h1 className={shared.heading}>Admin dashboard</h1>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid var(--line)", overflowX: "auto" }} role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 16px",
              fontSize: 13.5,
              fontWeight: 600,
              whiteSpace: "nowrap",
              color: tab === t.key ? "var(--paper)" : "var(--dim)",
              borderBottom: tab === t.key ? "2px solid var(--violet)" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "users" && <UsersTab />}
      {tab === "complaints" && <ComplaintsTab />}
      {tab === "notifications" && <NotificationsTab />}
      {tab === "expertise" && <ExpertiseTab />}
      {tab === "aiNotes" && <AiNotesTab />}
      {tab === "seminars" && <SeminarsTab />}
      {tab === "gds" && <GdsTab />}
      {tab === "auditLog" && <AuditLogTab />}
      {tab === "rbac" && isSuperadmin && <RbacTab />}
      {tab === "gateway" && isSuperadmin && <GatewayTab />}
    </section>
  );
}
