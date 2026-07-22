"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useMe, useMyStats, useUpdateProfile, useUploadProfilePhoto } from "@/lib/queries/users";
import { useToast } from "@/components/ui/Toast";
import { Button, ButtonStatus } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { ProfileCardSkeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { ExpertisePicker } from "@/components/ExpertisePicker";
import { Eligibility } from "@/lib/api";
import shared from "../../shared.module.css";

const ELIGIBILITY_LABELS: Record<keyof Eligibility, string> = {
  canHostSeminar: "Can host a seminar",
  canOrganizeGD: "Can organize a GD",
  canAttendGD: "Can attend a GD",
};

// only show pills for what's unlocked -- a list of things you can't do yet isn't a badge, it's a nag
function EligibilityBadges({ eligibility }: { eligibility: Eligibility }) {
  const unlocked = (Object.keys(ELIGIBILITY_LABELS) as (keyof Eligibility)[]).filter((key) => eligibility[key]);

  if (unlocked.length === 0) {
    return (
      <p className={shared.muted} style={{ marginTop: 16 }}>
        Keep helping out to unlock seminar and GD badges.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
      {unlocked.map((key) => (
        <span
          key={key}
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: 999,
            background: "var(--bg-alt)",
            color: "var(--ink)",
          }}
        >
          {ELIGIBILITY_LABELS[key]}
        </span>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { showToast } = useToast();
  const me = useMe();
  const updateProfile = useUpdateProfile();
  const uploadPhoto = useUploadProfilePhoto();
  const myStats = useMyStats();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [aiNotes, setAiNotes] = useState(false);
  const [saveStatus, setSaveStatus] = useState<ButtonStatus>("idle");
  // synced during render (React's "adjust state when data changes" pattern), not in
  // an effect, so it can't trigger a cascading re-render
  const [syncedProfileId, setSyncedProfileId] = useState<string | null>(null);

  if (me.data && me.data.id !== syncedProfileId) {
    setSyncedProfileId(me.data.id);
    setName(me.data.name ?? "");
    setBio(me.data.bio ?? "");
    setAiNotes(me.data.aiNotesAndTranscriptsEnabled);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saveStatus === "loading") return;

    setSaveStatus("loading");
    try {
      await updateProfile.mutateAsync({ name, bio, aiNotesAndTranscriptsEnabled: aiNotes });
      setSaveStatus("success");
      showToast("Profile updated");
      setTimeout(() => setSaveStatus("idle"), 1500);
    } catch {
      setSaveStatus("idle");
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

  function handleLogout() {
    logout();
    router.push("/");
  }

  if (me.isLoading) {
    return (
      <section style={{ padding: "32px 0" }}>
        <ProfileCardSkeleton />
      </section>
    );
  }

  if (me.isError || !me.data) {
    return (
      <p className={shared.error} style={{ padding: "32px 0" }}>
        Couldn&apos;t load your profile. Try refreshing the page.
      </p>
    );
  }

  return (
    <PageTransition>
      <section style={{ padding: "32px 0" }}>
        <h1 className={shared.heading}>Your profile</h1>
        <p className={shared.muted} style={{ marginBottom: 24 }}>
          {me.data.email ?? me.data.phone}
        </p>

        <Card style={{ maxWidth: 440 }}>
          <div style={{ marginBottom: 20 }}>
            <Avatar
              photoUrl={me.data.photoUrl}
              name={me.data.name}
              uploading={uploadPhoto.isPending}
              onFileSelected={handlePhotoSelected}
              onInvalidFile={(message) => showToast(message, "error")}
            />
          </div>

          <form onSubmit={handleSave}>
            <fieldset disabled={saveStatus === "loading"} style={{ border: "none", padding: 0, margin: 0 }}>
              <Input id="name" label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              <Input
                id="bio"
                label="Bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What do you help people with?"
              />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <input
                  id="aiNotes"
                  type="checkbox"
                  checked={aiNotes}
                  onChange={(e) => setAiNotes(e.target.checked)}
                  style={{ width: 20, height: 20 }}
                />
                <label htmlFor="aiNotes" style={{ fontSize: 14 }}>
                  Send me AI notes and transcripts after my sessions
                </label>
              </div>
            </fieldset>

            <Button type="submit" status={saveStatus} loadingLabel="Saving…" successLabel="Saved">
              Save changes
            </Button>
            <Link href="/change-password" style={{ display: "block", marginTop: 10 }}>
              <Button type="button" variant="secondary" disabled={saveStatus === "loading"}>
                Change password
              </Button>
            </Link>
            <Button
              type="button"
              variant="secondary"
              style={{ marginTop: 10 }}
              onClick={handleLogout}
              disabled={saveStatus === "loading"}
            >
              Log out
            </Button>
          </form>
        </Card>

        <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", margin: "32px 0 14px" }}>
          Your expertise
        </h2>
        <Card style={{ maxWidth: 440 }}>
          <ExpertisePicker />
        </Card>

        <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", margin: "32px 0 14px" }}>
          Your stats
        </h2>
        <Card style={{ maxWidth: 440 }}>
          {myStats.isLoading && (
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1, height: 40, background: "var(--bg-alt)", borderRadius: 4 }} />
              <div style={{ flex: 1, height: 40, background: "var(--bg-alt)", borderRadius: 4 }} />
            </div>
          )}
          {myStats.isError && <p className={shared.muted}>Couldn&apos;t load your stats.</p>}
          {myStats.isSuccess && (
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div>
                <p style={{ fontWeight: 900, fontSize: 20 }}>{myStats.data.minutesResolved}</p>
                <p className={shared.muted}>Minutes resolved</p>
              </div>
              <div>
                <p style={{ fontWeight: 900, fontSize: 20 }}>
                  {myStats.data.ratingCount > 0 ? myStats.data.avgRating.toFixed(1) : "—"}
                </p>
                <p className={shared.muted}>Avg rating ({myStats.data.ratingCount})</p>
              </div>
              <div>
                <p style={{ fontWeight: 900, fontSize: 20 }}>{myStats.data.minutesListener}</p>
                <p className={shared.muted}>Minutes as listener</p>
              </div>
            </div>
          )}
          {myStats.isSuccess && (
            <EligibilityBadges eligibility={myStats.data.eligibility} />
          )}
        </Card>
      </section>
    </PageTransition>
  );
}
