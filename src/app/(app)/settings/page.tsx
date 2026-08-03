"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useMe, useUpdateProfile, useUploadProfilePhoto } from "@/lib/queries/users";
import { useToast } from "@/components/ui/Toast";
import { Button, ButtonStatus } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { PageTransition } from "@/components/ui/PageTransition";
import { ExpertisePicker } from "@/components/ExpertisePicker";
import { AppearanceSettings } from "@/components/AppearanceSettings";
import { LanguagePicker } from "@/components/LanguagePicker";
import { Card, SectionLabel } from "@/components/scoreboard/kit";
import { useTranslation } from "@/lib/i18n/context";
import shared from "../../shared.module.css";

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const me = useMe();
  const updateProfile = useUpdateProfile();
  const uploadPhoto = useUploadProfilePhoto();

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
      showToast(t("common.saved"));
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

  return (
    <PageTransition>
      <div className="space-y-8 py-8">
        <h1 className={shared.heading}>{t("settings.title")}</h1>

        <section>
          <SectionLabel>{t("settings.account")}</SectionLabel>
          <Card className="p-5">
            {me.isSuccess && (
              <>
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
                    <Input id="name" label={t("settings.name")} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("settings.name")} />
                    <Input id="bio" label={t("settings.bio")} value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t("settings.bioPlaceholder")} />
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <input
                        id="aiNotes"
                        type="checkbox"
                        checked={aiNotes}
                        onChange={(e) => setAiNotes(e.target.checked)}
                        style={{ width: 20, height: 20 }}
                      />
                      <label htmlFor="aiNotes" style={{ fontSize: 14 }}>
                        {t("settings.aiNotes")}
                      </label>
                    </div>
                    <p className="mb-4 text-xs text-muted-foreground">{t("settings.aiNotesDesc")}</p>
                  </fieldset>

                  <Button type="submit" status={saveStatus} loadingLabel={t("common.saving")} successLabel={t("common.saved")}>
                    {t("settings.saveChanges")}
                  </Button>
                  <Link href="/change-password" style={{ display: "block", marginTop: 10 }}>
                    <Button type="button" variant="secondary" disabled={saveStatus === "loading"}>
                      {t("settings.changePassword")}
                    </Button>
                  </Link>
                  <Button type="button" variant="secondary" style={{ marginTop: 10 }} onClick={handleLogout} disabled={saveStatus === "loading"}>
                    {t("settings.logout")}
                  </Button>
                </form>
              </>
            )}
          </Card>
        </section>

        <section>
          <SectionLabel>{t("settings.expertise")}</SectionLabel>
          <Card className="p-5">
            <ExpertisePicker />
          </Card>
        </section>

        <section>
          <SectionLabel>{t("settings.appearance")}</SectionLabel>
          <Card className="p-5">
            <AppearanceSettings />
          </Card>
        </section>

        <section>
          <SectionLabel>{t("settings.language")}</SectionLabel>
          <Card className="p-5">
            <LanguagePicker />
          </Card>
        </section>
      </div>
    </PageTransition>
  );
}
