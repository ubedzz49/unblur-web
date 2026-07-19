"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card } from "@/components/ui/Card";
import { Button, ButtonStatus } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { DoubtExpertisePicker, SelectedExpertise } from "@/components/DoubtExpertisePicker";
import { useToast } from "@/components/ui/Toast";
import { useMe } from "@/lib/queries/users";
import { useCreateDoubt } from "@/lib/queries/doubts";
import shared from "../../../shared.module.css";

export default function NewDoubtPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const me = useMe();
  const createDoubt = useCreateDoubt();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expertise, setExpertise] = useState<SelectedExpertise[]>([]);
  const [submitStatus, setSubmitStatus] = useState<ButtonStatus>("idle");

  const isValid = title.trim().length > 0 && expertise.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || !me.data || submitStatus === "loading") return;

    setSubmitStatus("loading");
    try {
      const trimmedDescription = description.trim();
      await createDoubt.mutateAsync({
        authorUserId: me.data.id,
        title: title.trim(),
        description: trimmedDescription || undefined,
        expertiseLevelIds: expertise.map((e) => e.levelId),
      });
      setSubmitStatus("success");
      showToast("Doubt posted");
      router.push("/feed");
    } catch (err) {
      setSubmitStatus("idle");
      showToast(err instanceof Error ? err.message : "Couldn't post that — try again.", "error");
    }
  }

  return (
    <PageTransition>
      <section style={{ padding: "32px 0" }}>
        <h1 className={shared.heading}>Post a doubt</h1>
        <p className={shared.muted} style={{ marginBottom: 24, maxWidth: "44ch" }}>
          Describe what&apos;s confusing you — people who know this subject will see it in their
          feed.
        </p>

        <Card style={{ maxWidth: 480 }}>
          <form onSubmit={handleSubmit}>
            <fieldset disabled={submitStatus === "loading"} style={{ border: "none", padding: 0, margin: 0 }}>
              <Input
                id="doubt-title"
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's the short version?"
              />
              <Textarea
                id="doubt-description"
                label="Description (optional)"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any extra detail that might help (optional)."
              />
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--muted)",
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Subject / level
                </label>
                <DoubtExpertisePicker
                  title={title}
                  description={description}
                  value={expertise}
                  onChange={setExpertise}
                />
              </div>
            </fieldset>

            <Button type="submit" status={submitStatus} loadingLabel="Posting…" successLabel="Posted" disabled={!isValid}>
              Post doubt
            </Button>
          </form>
        </Card>
      </section>
    </PageTransition>
  );
}
