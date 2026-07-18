"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, updateMe, UserProfile } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { SiteHeader } from "../site-header";
import shared from "../shared.module.css";

const SAVED_MESSAGE_MS = 2500;

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
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // a ref, not just the `saving` state, so truly-simultaneous clicks (before React
  // has re-rendered to reflect setSaving(true)) still can't fire a second request
  const savingRef = useRef(false);

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

  useEffect(() => {
    return () => clearTimeout(savedTimeout.current);
  }, []);

  function clearSavedMessageSoon() {
    clearTimeout(savedTimeout.current);
    savedTimeout.current = setTimeout(() => setSaved(false), SAVED_MESSAGE_MS);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;

    const token = getToken();
    if (!token) {
      savingRef.current = false;
      return;
    }

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
      clearSavedMessageSoon();
    } catch (err) {
      setError(err instanceof Error ? err.message : "couldn't save that");
    } finally {
      savingRef.current = false;
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
          <fieldset
            disabled={saving}
            style={{ border: "none", padding: 0, margin: 0 }}
          >
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
          </fieldset>

          {error && (
            <p className={shared.error} role="alert">
              {error}
            </p>
          )}
          <p
            role="status"
            style={{
              color: "var(--accent)",
              fontWeight: 700,
              fontSize: 14,
              minHeight: 20,
              marginBottom: 8,
              visibility: saved ? "visible" : "hidden",
            }}
          >
            ✓ Saved
          </p>

          <button className={shared.button} type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            className={shared.buttonSecondary}
            style={{ marginTop: 10 }}
            onClick={handleLogout}
            disabled={saving}
          >
            Log out
          </button>
        </form>
      </section>
    </div>
  );
}
