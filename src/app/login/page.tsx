"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendOtp, verifyOtp } from "@/lib/api";
import { saveToken } from "@/lib/auth";
import { SiteHeader } from "../site-header";
import shared from "../shared.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"identifier" | "otp">("identifier");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await sendOtp(identifier);
      setDevOtp(res.otp ?? null);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await verifyOtp(identifier, otp);
      saveToken(res.token);
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "that code didn't work");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={shared.wrap}>
      <SiteHeader />
      <section style={{ padding: "40px 0" }}>
        <h1 className={shared.heading}>Log in to Unblur</h1>
        <p className={shared.muted} style={{ marginBottom: 24 }}>
          Use the email or phone you post doubts with.
        </p>

        <div className={shared.card}>
          {step === "identifier" && (
            <form onSubmit={handleSend}>
              <div className={shared.field}>
                <label className={shared.label} htmlFor="identifier">
                  Email or phone
                </label>
                <input
                  id="identifier"
                  className={shared.input}
                  placeholder="you@school.edu"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              {error && <p className={shared.error}>{error}</p>}
              <button className={shared.button} type="submit" disabled={loading}>
                {loading ? "Sending…" : "Send code"}
              </button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerify}>
              <p className={shared.muted} style={{ marginBottom: 14 }}>
                Code sent to {identifier}.
              </p>
              {devOtp && (
                <p className={shared.muted} style={{ marginBottom: 14 }}>
                  (dev only — code is {devOtp})
                </p>
              )}
              <div className={shared.field}>
                <label className={shared.label} htmlFor="otp">
                  6-digit code
                </label>
                <input
                  id="otp"
                  className={shared.input}
                  placeholder="000000"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  autoComplete="one-time-code"
                  required
                />
              </div>
              {error && <p className={shared.error}>{error}</p>}
              <button className={shared.button} type="submit" disabled={loading}>
                {loading ? "Verifying…" : "Verify and continue"}
              </button>
              <button
                type="button"
                className={shared.buttonSecondary}
                style={{ marginTop: 10 }}
                onClick={() => {
                  setStep("identifier");
                  setOtp("");
                  setError(null);
                }}
              >
                Use a different email or phone
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
