"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock, Headphones, Star, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useMe, useMyStats, useUpdateProfile, useUploadProfilePhoto } from "@/lib/queries/users";
import { useToast } from "@/components/ui/Toast";
import { Button, ButtonStatus } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { ProfileCardSkeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { ExpertisePicker } from "@/components/ExpertisePicker";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";
import { Card, SectionLabel, StatTile } from "@/components/scoreboard/kit";
import { ScoreHero } from "@/components/scoreboard/score-hero";
import { EligibilityLadder } from "@/components/scoreboard/eligibility-ladder";
import { UserStats } from "@/lib/api";
import shared from "../../shared.module.css";

// derived from the real gdPoints stat -- not a fabricated field, just a label tier
// over a number the API already returns
function scoreRank(gdPoints: number): string {
  if (gdPoints >= 100) return "Elite";
  if (gdPoints >= 50) return "Advanced";
  if (gdPoints >= 20) return "Rising";
  return "New";
}

function CareerStats({ stats }: { stats: UserStats }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatTile label="Minutes resolved" value={stats.minutesResolved} sub="Lifetime on live calls" icon={Clock} accent />
      <StatTile
        label="Avg rating"
        value={stats.ratingCount > 0 ? stats.avgRating.toFixed(1) : "—"}
        sub={`${stats.ratingCount} ratings`}
        icon={Star}
      />
      <StatTile label="Listener minutes" value={stats.minutesListener} sub="Time spent in GDs" icon={Headphones} />
      <StatTile label="Communication score" value={stats.gdPoints.toFixed(1)} sub={scoreRank(stats.gdPoints)} icon={Sparkles} />
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

  const initials = (me.data.name ?? me.data.email ?? me.data.phone ?? "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <PageTransition>
      <div className="space-y-8 py-8">
        {myStats.isSuccess && (
          <ScoreHero
            name={me.data.name ?? "Unnamed"}
            bio={bio || "No bio yet."}
            initials={initials}
            score={myStats.data.gdPoints}
            rank={scoreRank(myStats.data.gdPoints)}
          />
        )}

        <section>
          <SectionLabel>Career stats</SectionLabel>
          {myStats.isLoading && <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-elevated" />)}</div>}
          {myStats.isError && <p className={shared.muted}>Couldn&apos;t load your stats.</p>}
          {myStats.isSuccess && <CareerStats stats={myStats.data} />}
        </section>

        <section>
          <SectionLabel>Your ladder</SectionLabel>
          <p className="-mt-1 mb-4 text-sm leading-relaxed text-muted-foreground">
            Every minute you resolve moves you up. Unlock higher-status ways to earn and grow your score.
          </p>
          {myStats.isSuccess && <EligibilityLadder stats={myStats.data} />}
        </section>

        <section>
          <SectionLabel>Account</SectionLabel>
          <Card className="p-5">
            <div className="mb-5 flex items-center gap-4">
              <Avatar
                photoUrl={me.data.photoUrl}
                name={me.data.name}
                uploading={uploadPhoto.isPending}
                onFileSelected={handlePhotoSelected}
                onInvalidFile={(message) => showToast(message, "error")}
              />
              <p className="text-sm text-muted-foreground">{me.data.email ?? me.data.phone}</p>
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
              <Button type="button" variant="secondary" style={{ marginTop: 10 }} onClick={handleLogout} disabled={saveStatus === "loading"}>
                Log out
              </Button>
            </form>
          </Card>
        </section>

        <section>
          <SectionLabel>Your expertise</SectionLabel>
          <Card className="p-5">
            <ExpertisePicker />
          </Card>
        </section>

        <section>
          <SectionLabel>Appearance</SectionLabel>
          <Card className="p-5">
            <ThemeCustomizer />
          </Card>
        </section>
      </div>
    </PageTransition>
  );
}
