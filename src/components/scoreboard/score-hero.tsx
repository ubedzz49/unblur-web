import { TrendingUp, Trophy } from "lucide-react";
import { Avatar, Pill } from "@/components/scoreboard/kit";

export function ScoreHero({
  name,
  bio,
  initials,
  score,
  rank,
  percentile,
}: {
  name: string;
  bio: string;
  initials: string;
  score: number;
  rank: string;
  percentile?: number;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="relative border-b border-border bg-elevated px-5 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <Trophy className="h-3.5 w-3.5 text-primary" />
              Communication score
            </div>
            <div className="num mt-1 text-fluid-display text-primary">{score.toLocaleString()}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Pill tone="gold">{rank}</Pill>
              {percentile !== undefined && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Top {percentile}% this month
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 px-5 py-5">
        <Avatar initials={initials} size="lg" ring />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">{name}</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{bio}</p>
        </div>
      </div>
    </section>
  );
}
