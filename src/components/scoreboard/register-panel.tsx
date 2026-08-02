import { Check, IndianRupee, ShieldCheck, Video } from "lucide-react";

export function RegisterPanel({
  fee,
  cta,
  soldOut = false,
  payeeNote,
  status,
  onPay,
  joinUrl,
  onGetJoinUrl,
}: {
  fee: number;
  cta: string;
  soldOut?: boolean;
  payeeNote: string;
  status: "idle" | "paying" | "joined";
  onPay: () => void;
  joinUrl?: string | null;
  onGetJoinUrl?: () => void;
}) {
  return (
    <div className="sticky bottom-20 z-30 md:bottom-4">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Entry fee</div>
            <div className="num flex items-center text-2xl font-semibold">
              <IndianRupee className="h-5 w-5" />
              {fee}
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-elevated px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">
            <ShieldCheck className="h-3 w-3" /> Sandbox
          </span>
        </div>

        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{payeeNote}</p>

        {status === "joined" ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-primary/15 py-3 text-sm font-semibold text-primary">
              <Check className="h-4 w-4" /> You&apos;re registered
            </div>
            <button
              type="button"
              onClick={onGetJoinUrl}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
            >
              <Video className="h-4 w-4" /> {joinUrl ? "Join meeting" : "Get join link"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onPay}
            disabled={soldOut || status === "paying"}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
          >
            {soldOut ? "Sold out" : status === "paying" ? "Processing…" : cta}
          </button>
        )}
      </div>
    </div>
  );
}
