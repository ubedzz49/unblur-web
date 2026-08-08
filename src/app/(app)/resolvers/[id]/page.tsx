"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { PageTransition } from "@/components/ui/PageTransition";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePublicUser } from "@/lib/queries/users";
import { useSeminars } from "@/lib/queries/seminars";

function formatFee(cents: number): string {
  return cents === 0 ? "Free" : `₹${(cents / 100).toFixed(0)} entry`;
}

export default function ResolverProfilePage() {
  const { id } = useParams<{ id: string }>();
  const user = usePublicUser(id);
  // resolver-profile.html shows "upcoming seminars" for this host -- filter the
  // shared upcoming-seminars list down to ones this person is hosting, since there's
  // no per-host seminars endpoint
  const seminars = useSeminars(true);
  const hostedSeminars = (seminars.data ?? []).filter((s) => s.hostUserId === id);

  if (user.isLoading) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-[760px] px-6 py-12">
          <Skeleton width={84} height={84} radius="50%" style={{ marginBottom: 24 }} />
          <Skeleton width="40%" height={20} style={{ marginBottom: 12 }} />
          <Skeleton width="80%" height={60} />
        </div>
      </PageTransition>
    );
  }

  if (user.isError || !user.data) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-[760px] px-6 py-12">
          <p style={{ color: "var(--dim)" }}>Couldn&apos;t load this profile.</p>
        </div>
      </PageTransition>
    );
  }

  const { data } = user;
  const initials = (data.name ?? "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <PageTransition>
      <div className="mx-auto max-w-[760px] px-6 py-12">
        <div className="mb-8 flex items-start gap-5.5">
          <span
            className="flex h-21 w-21 shrink-0 items-center justify-center rounded-full text-2xl font-semibold"
            style={{ background: "var(--violet-dim)", color: "var(--violet)" }}
          >
            {initials}
          </span>
          <div>
            <h1 className="mb-1.5 text-[26px] font-semibold" style={{ fontFamily: "var(--font-fraunces)" }}>
              {data.name ?? "Unblur resolver"}
            </h1>
            {data.bio && <p className="max-w-[440px] text-[14.5px]" style={{ color: "var(--dim)" }}>{data.bio}</p>}
          </div>
        </div>

        <div className="mb-8 flex overflow-hidden rounded-[14px] border" style={{ borderColor: "var(--line)", background: "var(--line)", gap: 1 }}>
          <div className="flex-1 p-5 text-center" style={{ background: "var(--surface)" }}>
            <div className="num text-2xl font-bold" style={{ color: "var(--violet)" }}>{data.stats.avgRating.toFixed(1)}</div>
            <div className="text-[11.5px]" style={{ color: "var(--dim)" }}>average rating</div>
          </div>
          <div className="flex-1 p-5 text-center" style={{ background: "var(--surface)" }}>
            <div className="num text-2xl font-bold" style={{ color: "var(--violet)" }}>{data.stats.minutesResolved}</div>
            <div className="text-[11.5px]" style={{ color: "var(--dim)" }}>minutes resolved</div>
          </div>
          <div className="flex-1 p-5 text-center" style={{ background: "var(--surface)" }}>
            <div className="num text-2xl font-bold" style={{ color: "var(--violet)" }}>{data.stats.eligibility.canHostSeminar ? "Yes" : "No"}</div>
            <div className="text-[11.5px]" style={{ color: "var(--dim)" }}>seminar eligible</div>
          </div>
          <div className="flex-1 p-5 text-center" style={{ background: "var(--surface)" }}>
            <div className="num text-2xl font-bold" style={{ color: "var(--violet)" }}>{data.stats.gdPoints}</div>
            <div className="text-[11.5px]" style={{ color: "var(--dim)" }}>GD score</div>
          </div>
        </div>

        {data.expertise.length > 0 && (
          <>
            <div className="mb-4 text-[13px] font-medium uppercase tracking-wide" style={{ color: "var(--dim)" }}>Expertise</div>
            <div className="mb-8 flex flex-wrap gap-2.5">
              {data.expertise.map((e) => (
                <span key={e.id} className="rounded-full border px-3.5 py-2 text-[13px]" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
                  {e.expertiseTypeName}
                  {e.expertiseLevelName && e.expertiseLevelName.toLowerCase() !== "general" ? ` (${e.expertiseLevelName})` : ""}
                </span>
              ))}
            </div>
          </>
        )}

        {hostedSeminars.length > 0 && (
          <>
            <div className="mb-4 text-[13px] font-medium uppercase tracking-wide" style={{ color: "var(--dim)" }}>Upcoming seminars</div>
            {hostedSeminars.map((seminar) => (
              <Link
                key={seminar.id}
                href={`/seminars/${seminar.id}`}
                className="mb-3 flex items-center justify-between rounded-[14px] border p-4.5"
                style={{ borderColor: "var(--line)", background: "var(--surface)" }}
              >
                <div>
                  <h4 className="mb-1 text-[14.5px] font-semibold">{seminar.title}</h4>
                  <span className="text-[12.5px]" style={{ color: "var(--dim)" }}>
                    {new Date(seminar.scheduledAt).toLocaleString()} · {formatFee(seminar.entryFeeCents)}
                  </span>
                </div>
                <span className="rounded-lg px-4 py-2 text-[12.5px] font-semibold" style={{ background: "var(--violet)", color: "var(--ink-strong)" }}>
                  Register
                </span>
              </Link>
            ))}
          </>
        )}
      </div>
    </PageTransition>
  );
}
