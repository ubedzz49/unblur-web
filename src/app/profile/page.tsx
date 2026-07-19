"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useMe, useUpdateProfile, useUploadProfilePhoto } from "@/lib/queries/users";
import { useToast } from "@/components/ui/Toast";
import { Button, ButtonStatus } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { ProfileCardSkeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { SiteHeader } from "../site-header";
import shared from "../shared.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const { isLoggedIn, logout } = useAuth();
  const { showToast } = useToast();
  const me = useMe();
  const updateProfile = useUpdateProfile();
  const uploadPhoto = useUploadProfilePhoto();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [aiNotes, setAiNotes] = useState(false);
  const [saveStatus, setSaveStatus] = useState<ButtonStatus>("idle");
  // tracks which fetched profile the form fields were last synced from -- set during
  // render (React's documented pattern for "adjust state when a prop changes"),
  // not in an effect, so it can't trigger a cascading re-render
  const [syncedProfileId, setSyncedProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

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

  if (!isLoggedIn) return null;

  if (me.isLoading) {
    return (
      <div className={shared.wrap}>
        <SiteHeader />
        <section style={{ padding: "40px 0" }}>
          <ProfileCardSkeleton />
        </section>
      </div>
    );
  }

  if (me.isError || !me.data) {
    return (
      <div className={shared.wrap}>
        <SiteHeader />
        <p className={shared.error} style={{ padding: "40px 0" }}>
          Couldn&apos;t load your profile. Try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <PageTransition className={shared.wrap}>
      <SiteHeader />
      <section style={{ padding: "40px 0" }}>
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
      </section>
    </PageTransition>
  );
}
