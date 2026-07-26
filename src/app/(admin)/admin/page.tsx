"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ApiError, ComplaintOutcome } from "@/lib/api";
import {
  useAddAdminExpertise,
  useAdminAiNotes,
  useAdminComplaintRecording,
  useAdminComplaints,
  useAdminExpertiseOptions,
  useAdminUsers,
  useBlockAdminUser,
  useImportAdminExpertise,
  useRefundBookingAsAdmin,
  useRemoveAdminExpertise,
  useResolveAdminComplaint,
  useRetryAdminAiNotes,
  useSendAdminNotification,
  useUnblockAdminUser,
} from "@/lib/queries/admin";
import shared from "../../shared.module.css";

type Tab = "users" | "complaints" | "notifications" | "expertise" | "aiNotes";

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
      <Card>
        <h3>Couldn&apos;t load users</h3>
        <Button type="button" onClick={() => users.refetch()}>
          Try again
        </Button>
      </Card>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
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
              <td style={{ padding: 8 }}>{u.blockedAt ? "Blocked" : "Active"}</td>
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
      <Card>
        <h3>Couldn&apos;t load complaints</h3>
        <Button type="button" onClick={() => complaints.refetch()}>
          Try again
        </Button>
      </Card>
    );
  }
  if (complaints.data?.length === 0) {
    return (
      <Card>
        <p className={shared.muted}>No complaints filed yet.</p>
      </Card>
    );
  }

  return (
    <>
      {complaints.data?.map((c) => (
        <Card key={c.id} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>Booking {c.bookingId.slice(0, 8)}</span>
            <span className={shared.muted} style={{ textTransform: "capitalize" }}>
              {c.status === "resolved" ? `Resolved — ${c.outcome}` : "Open"}
            </span>
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
    <Card style={{ maxWidth: 480 }}>
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
        <Card style={{ maxWidth: 380, flex: "1 1 320px" }}>
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

        <Card style={{ maxWidth: 380, flex: "1 1 320px" }}>
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
        <div style={{ overflowX: "auto" }}>
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
      <Card>
        <h3>Couldn&apos;t load AI notes deliveries</h3>
        <Button type="button" onClick={() => deliveries.refetch()}>
          Try again
        </Button>
      </Card>
    );
  }
  if (deliveries.data?.length === 0) {
    return (
      <Card>
        <p className={shared.muted}>No failed deliveries.</p>
      </Card>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
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

export default function AdminDashboardPage() {
  const [tab, setTab] = useState<Tab>("users");

  const tabs: { key: Tab; label: string }[] = [
    { key: "users", label: "Users" },
    { key: "complaints", label: "Complaints" },
    { key: "notifications", label: "Notifications" },
    { key: "expertise", label: "Topics" },
    { key: "aiNotes", label: "AI Notes" },
  ];

  return (
    <section style={{ padding: "16px 0" }}>
      <h1 className={shared.heading}>Admin dashboard</h1>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid var(--line)" }} role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 14px",
              fontSize: 14,
              fontWeight: 700,
              color: tab === t.key ? "var(--ink)" : "var(--muted)",
              borderBottom: tab === t.key ? "2px solid var(--accent)" : "2px solid transparent",
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
    </section>
  );
}
