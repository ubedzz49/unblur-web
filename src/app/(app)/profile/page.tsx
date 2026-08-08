"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useMe, useMyStats, useUpdateProfile, useUploadProfilePhoto } from "@/lib/queries/users";
import { useToast } from "@/components/ui/Toast";
import { ProfileCardSkeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { Avatar } from "@/components/ui/Avatar";
import { ExpertisePicker } from "@/components/ExpertisePicker";
import { LanguagePicker } from "@/components/LanguagePicker";
import { useTranslation } from "@/lib/i18n/context";

/** Merges what the app used to split into separate Profile and Settings pages into
 * ONE dashboard per profile-dashboard.html: identity header, stat strip, eligibility
 * card (both seminar conditions + both GD conditions), expertise tags, and a settings
 * block. /settings itself now just redirects here (see settings/page.tsx) -- there's
 * nothing settings-specific left that doesn't belong on this one page. */
export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const me = useMe();
  const myStats = useMyStats();
  const updateProfile = useUpdateProfile();
  const uploadPhoto = useUploadProfilePhoto();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [syncedProfileId, setSyncedProfileId] = useState<string | null>(null);

  if (me.data && me.data.id !== syncedProfileId) {
    setSyncedProfileId(me.data.id);
    setName(me.data.name ?? "");
    setBio(me.data.bio ?? "");
  }

  if (me.isLoading) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-[900px] px-6 py-10">
          <ProfileCardSkeleton />
        </div>
      </PageTransition>
    );
  }

  if (me.isError || !me.data) {
    return (
      <PageTransition>
        <p className="px-6 py-10" style={{ color: "var(--red)" }}>
          Couldn&apos;t load your profile. Try refreshing the page.
        </p>
      </PageTransition>
    );
  }

  const stats = myStats.data;
  const minutesResolved = stats?.minutesResolved ?? 0;
  const avgRating = stats?.avgRating ?? 0;
  const minutesListener = stats?.minutesListener ?? 0;
  const gdPoints = stats?.gdPoints ?? 0;
  const eligibility = stats?.eligibility;

  const seminarMinutesMet = minutesResolved >= 300;
  const seminarRatingMet = avgRating >= 3.5;
  const canHostSeminar = eligibility?.canHostSeminar ?? (seminarMinutesMet && seminarRatingMet);
  const canOrganizeGD = eligibility?.canOrganizeGD ?? minutesResolved >= 100;
  const canAttendGD = eligibility?.canAttendGD ?? minutesListener >= 50;

  async function handleSaveIdentity(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({ name, bio });
      setEditing(false);
      showToast(t("common.saved"));
    } catch {
      showToast("Couldn't save that — try again.", "error");
    }
  }

  async function handlePhotoSelected(file: File) {
    try {
      const publicUrl = await uploadPhoto.mutateAsync(file);
      await updateProfile.mutateAsync({ photoUrl: publicUrl });
      showToast("Photo updated");
    } catch {
      showToast("Couldn't upload that photo — try again.", "error");
    }
  }

  async function handleToggleAiNotes() {
    try {
      await updateProfile.mutateAsync({ aiNotesAndTranscriptsEnabled: !me.data!.aiNotesAndTranscriptsEnabled });
    } catch {
      showToast("Couldn't update that — try again.", "error");
    }
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-[900px] px-6 py-10">
        {/* Identity header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              photoUrl={me.data.photoUrl}
              name={me.data.name}
              uploading={uploadPhoto.isPending}
              onFileSelected={handlePhotoSelected}
              onInvalidFile={(message) => showToast(message, "error")}
            />
            <div>
              <h1 className="text-[22px] font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
                {me.data.name || "Your profile"}
              </h1>
              <p className="text-[13.5px]" style={{ color: "var(--dim)" }}>
                {me.data.email ?? me.data.phone ?? "Member since " + new Date(me.data.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded-lg border px-4.5 py-2.5 text-[13px]"
            style={{ borderColor: "var(--line)", color: "var(--paper)" }}
          >
            {editing ? "Cancel" : "Edit profile"}
          </button>
        </div>

        {editing && (
          <form onSubmit={handleSaveIdentity} className="mb-8 rounded-2xl border p-5" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
            <label className="mb-1.5 block text-xs" style={{ color: "var(--dim)" }} htmlFor="profile-name">Name</label>
            <input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mb-4 w-full rounded-lg border px-3.5 py-2.5 text-sm"
              style={{ borderColor: "var(--line)", background: "var(--surface-2)", color: "var(--paper)" }}
            />
            <label className="mb-1.5 block text-xs" style={{ color: "var(--dim)" }} htmlFor="profile-bio">Bio</label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="mb-4 w-full rounded-lg border px-3.5 py-2.5 text-sm"
              style={{ borderColor: "var(--line)", background: "var(--surface-2)", color: "var(--paper)" }}
            />
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="rounded-lg px-4.5 py-2.5 text-sm font-semibold"
              style={{ background: "var(--violet)", color: "var(--ink-strong)" }}
            >
              Save changes
            </button>
          </form>
        )}

        {/* Stat strip */}
        <div className="mb-9 flex overflow-hidden rounded-[14px] border" style={{ borderColor: "var(--line)", background: "var(--line)", gap: 1 }}>
          {[
            { value: minutesResolved, label: "minutes resolved" },
            { value: stats && stats.ratingCount > 0 ? avgRating.toFixed(1) : "—", label: "average rating" },
            { value: minutesListener, label: "minutes as listener" },
            { value: gdPoints, label: "GD score" },
          ].map((s) => (
            <div key={s.label} className="flex-1 p-5 text-center" style={{ background: "var(--surface)" }}>
              <div className="num text-2xl font-bold" style={{ color: "var(--violet)" }}>{s.value}</div>
              <div className="text-[11.5px]" style={{ color: "var(--dim)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Eligibility */}
        <div className="mb-4 text-[13px] font-medium uppercase tracking-wide" style={{ color: "var(--dim)" }}>Eligibility</div>
        <div className="mb-9 rounded-[14px] border p-5.5" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          <EligibilityRow
            label="Host a seminar"
            met={canHostSeminar}
            statusText={canHostSeminar ? "Eligible" : `Needs both: ${minutesResolved} / 300 min, ${avgRating.toFixed(1)} / 3.5 rating`}
            pct={Math.min(100, Math.min((minutesResolved / 300) * 100, seminarRatingMet ? 100 : (avgRating / 3.5) * 100))}
          />
          <EligibilityRow
            label="Organize a group discussion"
            met={canOrganizeGD}
            statusText={canOrganizeGD ? "Eligible, 100 min required" : `${minutesResolved} / 100 min resolved`}
            pct={Math.min(100, (minutesResolved / 100) * 100)}
          />
          <EligibilityRow
            label="Join a group discussion"
            met={canAttendGD}
            statusText={canAttendGD ? "Eligible, 50 listener min required" : `${minutesListener} / 50 listener min`}
            pct={Math.min(100, (minutesListener / 50) * 100)}
            last
          />
        </div>

        {/* Expertise */}
        <div className="mb-4 text-[13px] font-medium uppercase tracking-wide" style={{ color: "var(--dim)" }}>Your expertise</div>
        <div className="mb-9">
          <ExpertisePicker />
        </div>

        {/* Settings */}
        <div className="mb-4 text-[13px] font-medium uppercase tracking-wide" style={{ color: "var(--dim)" }}>Settings</div>
        <div className="mb-4 rounded-[14px] border p-1.5" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          <SettingRow title="AI notes and transcripts" desc="Applies to future sessions only, not ones already completed.">
            <button
              type="button"
              role="switch"
              aria-checked={me.data.aiNotesAndTranscriptsEnabled}
              onClick={handleToggleAiNotes}
              className="relative h-6 w-10.5 rounded-full transition-colors"
              style={{ background: me.data.aiNotesAndTranscriptsEnabled ? "var(--violet)" : "var(--violet-dim)" }}
            >
              <span
                className="absolute top-0.5 h-5 w-5 rounded-full transition-all"
                style={{ background: "var(--paper)", left: me.data.aiNotesAndTranscriptsEnabled ? 21 : 3 }}
              />
            </button>
          </SettingRow>
          <SettingRow title="Password" desc="Change your account password.">
            <Link href="/change-password" className="text-[13px] font-semibold" style={{ color: "var(--violet)" }}>
              Change
            </Link>
          </SettingRow>
          <SettingRow title="Payouts" desc="View your payout history and pending holds.">
            <Link href="/requests" className="text-[13px] font-semibold" style={{ color: "var(--violet)" }}>
              View
            </Link>
          </SettingRow>
          <SettingRow title="Language" desc="Choose which language Unblur is shown in." last>
            <span />
          </SettingRow>
        </div>
        <div className="mb-9 rounded-[14px] border p-5" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          <LanguagePicker />
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border px-4.5 py-2.5 text-sm"
          style={{ borderColor: "var(--line)", color: "var(--red)" }}
        >
          {t("settings.logout")}
        </button>
      </div>
    </PageTransition>
  );
}

function EligibilityRow({
  label,
  met,
  statusText,
  pct,
  last,
}: {
  label: string;
  met: boolean;
  statusText: string;
  pct: number;
  last?: boolean;
}) {
  return (
    <div className={last ? "" : "mb-5"}>
      <div className="mb-2 flex justify-between text-[13.5px]">
        <span>{label}</span>
        <span className="text-xs" style={{ color: met ? "var(--green)" : "var(--dim)" }}>{statusText}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ background: "#242233" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: met ? "var(--green)" : "var(--violet)" }} />
      </div>
    </div>
  );
}

function SettingRow({ title, desc, children, last }: { title: string; desc: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-4"
      style={last ? undefined : { borderBottom: "1px solid var(--line)" }}
    >
      <div>
        <h4 className="mb-1 text-sm font-semibold">{title}</h4>
        <p className="text-xs" style={{ color: "var(--dim)" }}>{desc}</p>
      </div>
      {children}
    </div>
  );
}
