"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, updateMe, UserProfile } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { SiteHeader } from "../site-header";
import shared from "../shared.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [aiNotes, setAiNotes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    getMe(token)
      .then((user) => {
        setProfile(user);
        setName(user.name ?? "");
        setBio(user.bio ?? "");
        setAiNotes(user.aiNotesAndTranscriptsEnabled);
      })
      .catch(() => {
        clearToken();
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateMe(token, {
        name,
        bio,
        aiNotesAndTranscriptsEnabled: aiNotes,
      });
      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "couldn't save that");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    clearToken();
    router.push("/");
  }

  if (loading) {
    return (
      <div className={shared.wrap}>
        <SiteHeader />
        <p className={shared.muted} style={{ padding: "40px 0" }}>
          Loading your profile…
        </p>
      </div>
    );
  }

  return (
    <div className={shared.wrap}>
      <SiteHeader />
      <section style={{ padding: "40px 0" }}>
        <h1 className={shared.heading}>Your profile</h1>
        <p className={shared.muted} style={{ marginBottom: 24 }}>
          {profile?.email ?? profile?.phone}
        </p>

        <form className={shared.card} onSubmit={handleSave} style={{ maxWidth: 440 }}>
          <div className={shared.field}>
            <label className={shared.label} htmlFor="name">
              Name
            </label>
            <input
              id="name"
              className={shared.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className={shared.field}>
            <label className={shared.label} htmlFor="bio">
              Bio
            </label>
            <input
              id="bio"
              className={shared.input}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What do you help people with?"
            />
          </div>

          <div className={shared.field} style={{ display: "flex", alignItems: "center", gap: 10 }}>
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

          {error && <p className={shared.error}>{error}</p>}
          {saved && <p className={shared.muted}>Saved.</p>}

          <button className={shared.button} type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            className={shared.buttonSecondary}
            style={{ marginTop: 10 }}
            onClick={handleLogout}
          >
            Log out
          </button>
        </form>
      </section>
    </div>
  );
}
