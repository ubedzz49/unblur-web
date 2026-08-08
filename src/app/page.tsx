"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Logo, LogoHero } from "@/components/Logo";

const STEPS = [
  { n: 1, title: "Post", desc: "Describe the doubt, pick the subject and level." },
  { n: 2, title: "Get offers", desc: "Qualified resolvers propose a price and time." },
  { n: 3, title: "Meet", desc: "Pay, get a call link, talk it through live." },
  { n: 4, title: "Rate", desc: "Leave a rating, it joins the resolver's record." },
];

const CARDS = [
  { title: "Doubt resolution", desc: "The core 1 on 1 loop everything else is built on top of. Live, paid, rated afterward.", meta: "Median first offer: 9 min" },
  { title: "Seminars", desc: "Resolvers with 300 plus minutes and a 3.5 plus rating can host paid, scheduled one to many sessions.", meta: "Earned, not open to all" },
  { title: "Group discussions", desc: "Timed speaking rooms with real enforcement. A post session vote builds a public communication score.", meta: "Flat organizer fee, no percentage cut" },
];

const COMPARISON: { label: string; search: [string, "yes" | "no"]; coaching: [string, "yes" | "no"]; unblur: [string, "yes" | "no"] }[] = [
  { label: "Answers your exact doubt", search: ["Rarely", "no"], coaching: ["Only in class hours", "no"], unblur: ["Yes, live", "yes"] },
  { label: "Real person, real time", search: ["No", "no"], coaching: ["Scheduled only", "yes"], unblur: ["Within minutes", "yes"] },
  { label: "Pay only for what you use", search: ["Free but unreliable", "yes"], coaching: ["Fixed monthly fee", "no"], unblur: ["Pay per session", "yes"] },
  { label: "Rated by real outcomes", search: ["No", "no"], coaching: ["Rarely public", "no"], unblur: ["Every resolver, publicly", "yes"] },
];

const CHIPS = [
  { kind: "Academic", desc: "Maths, Class 12" },
  { kind: "Competitive", desc: "CAT, Quant" },
  { kind: "Corporate", desc: "Leadership, Mid" },
  { kind: "Corporate", desc: "Excel, Advanced" },
];

export default function LandingPage() {
  const { isLoggedIn } = useAuth();
  const primaryHref = isLoggedIn ? "/home" : "/login";

  return (
    <div>
      <nav
        className="sticky top-0 z-10 flex items-center justify-between border-b px-6 py-6 backdrop-blur-md sm:px-16"
        style={{ borderColor: "var(--line)", background: "rgba(15,14,20,0.85)" }}
      >
        <Link href="/" className="flex items-center gap-2 text-[18px] font-bold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          <Logo size={16} />
          unblur
        </Link>
        <div className="hidden gap-9 text-sm sm:flex" style={{ color: "var(--dim)" }}>
          <Link href="/feed" className="hover:text-[var(--paper)]">Feed</Link>
          <span>Seminars</span>
          <span>Group discussions</span>
          <span>Become a resolver</span>
        </div>
        <Link
          href={primaryHref}
          className="rounded-full border px-5 py-2 text-[13.5px]"
          style={{ borderColor: "var(--line)" }}
        >
          {isLoggedIn ? "Go to your home" : "Sign in"}
        </Link>
      </nav>

      <header className="mx-auto max-w-[760px] px-6 pb-8 pt-24 text-center sm:px-16 sm:pt-28">
        <div className="mb-6 flex justify-center">
          <LogoHero size={60} />
        </div>
        <p className="mb-5 text-[13px] font-medium uppercase tracking-[0.08em]" style={{ color: "var(--violet)" }}>
          Compared to what you are already doing
        </p>
        <h1 className="text-fluid-display">Search engines and video lectures were not built to answer your doubt.</h1>
        <p className="mx-auto mt-5 max-w-[520px] text-[17px]" style={{ color: "var(--dim)" }}>
          Post what is confusing you. Someone who actually knows it shows up on a call, priced, timed, and rated by
          people who were stuck exactly like you.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3.5">
          <Link
            href={primaryHref}
            className="rounded-full px-7 py-4 text-[14.5px] font-semibold transition-transform hover:-translate-y-0.5"
            style={{ background: "var(--violet)", color: "var(--ink-strong)" }}
          >
            Post a doubt
          </Link>
          <Link href={primaryHref} className="rounded-full border px-5.5 py-4 text-[14.5px]" style={{ borderColor: "var(--line)" }}>
            Start resolving
          </Link>
        </div>
      </header>

      <section className="px-6 py-20 sm:px-16">
        <div className="mx-auto max-w-[900px] overflow-hidden overflow-x-auto rounded-2xl border" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr>
                {["What you need", "Search engine", "Coaching center", "Unblur"].map((h) => (
                  <th
                    key={h}
                    className="border-b px-5 py-4 text-left text-[12px] font-medium uppercase tracking-[0.04em]"
                    style={{ borderColor: "var(--line)", color: "var(--dim)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label}>
                  <td className="border-b px-5 py-4 font-semibold" style={{ borderColor: "var(--line)" }}>{row.label}</td>
                  {[row.search, row.coaching, row.unblur].map(([text, kind], i) => (
                    <td
                      key={i}
                      className="border-b px-5 py-4"
                      style={{ borderColor: "var(--line)", color: kind === "yes" ? "var(--green)" : "var(--red)" }}
                    >
                      {text}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="px-6 py-20 sm:px-16">
        <div className="mx-auto mb-12 max-w-[640px] text-center">
          <h2 className="text-fluid-title">Four steps. That is the whole loop.</h2>
        </div>
        <div className="mx-auto grid max-w-[1000px] grid-cols-1 gap-9 sm:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <div
                className="mx-auto mb-4 flex h-13 w-13 items-center justify-center rounded-full border text-lg font-bold"
                style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--violet)", fontFamily: "var(--font-space-grotesk)" }}
              >
                {s.n}
              </div>
              <h3 className="mb-1.5 text-base font-semibold">{s.title}</h3>
              <p className="mx-auto max-w-[170px] text-[13px]" style={{ color: "var(--dim)" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 sm:px-16">
        <div className="mx-auto mb-12 max-w-[640px] text-center">
          <h2 className="text-fluid-title">Three ways in, one taxonomy underneath</h2>
        </div>
        <div className="mx-auto grid max-w-[1150px] grid-cols-1 gap-5 sm:grid-cols-3">
          {CARDS.map((c) => (
            <div
              key={c.title}
              className="rounded-[18px] border p-8 transition-transform hover:-translate-y-1.5"
              style={{ borderColor: "var(--line)", background: "var(--surface)" }}
            >
              <h3 className="mb-3 text-[21px] font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>{c.title}</h3>
              <p className="text-sm" style={{ color: "var(--dim)" }}>{c.desc}</p>
              <div className="mt-4.5 border-t pt-4 text-[12.5px]" style={{ borderColor: "var(--line)", color: "var(--violet)" }}>{c.meta}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 sm:px-16">
        <div className="mx-auto mb-12 max-w-[640px] text-center">
          <h2 className="text-fluid-title">One taxonomy, everywhere</h2>
          <p className="mt-3.5 text-[15.5px]" style={{ color: "var(--dim)" }}>
            Academic, competitive exam, or corporate, matching, feeds, and eligibility all key off the same tree.
          </p>
        </div>
        <div className="mx-auto flex max-w-[800px] flex-wrap justify-center gap-3">
          {CHIPS.map((c, i) => (
            <div key={i} className="rounded-full border px-5 py-3 text-[13.5px]" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
              <b style={{ color: "var(--violet)" }}>{c.kind}</b> {c.desc}
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t px-6 py-24 text-center sm:px-16" style={{ borderColor: "var(--line)" }}>
        <h2 className="mb-7 text-fluid-title">Your next doubt does not need a search engine.</h2>
        <Link
          href={primaryHref}
          className="inline-block rounded-full px-7 py-4 text-[14.5px] font-semibold"
          style={{ background: "var(--violet)", color: "var(--ink-strong)" }}
        >
          Post your first doubt
        </Link>
      </footer>
    </div>
  );
}
