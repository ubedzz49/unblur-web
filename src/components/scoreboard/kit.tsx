import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* ----------------------------------------------------------------------------
 * Avatar — initials chip, optional gold "achievement" ring
 * -------------------------------------------------------------------------- */
export function Avatar({
  initials,
  size = 'md',
  ring = false,
  className,
}: {
  initials: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  ring?: boolean
  className?: string
}) {
  const sizes = {
    xs: 'h-7 w-7 text-[0.65rem]',
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-24 w-24 text-2xl',
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full bg-elevated font-extrabold tracking-tight text-foreground',
        ring && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  )
}

/* ----------------------------------------------------------------------------
 * Pill — status / label chip
 * -------------------------------------------------------------------------- */
export function Pill({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'gold' | 'danger' | 'outline' | 'live' | 'success'
  className?: string
}) {
  const tones = {
    neutral: 'bg-elevated text-muted-foreground',
    gold: 'bg-primary/15 text-primary',
    danger: 'bg-destructive/15 text-destructive',
    success: 'bg-primary/15 text-primary',
    outline: 'border border-border text-muted-foreground',
    live: 'bg-destructive text-destructive-foreground',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn('relative flex h-2 w-2', className)}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
    </span>
  )
}

/* ----------------------------------------------------------------------------
 * Card
 * -------------------------------------------------------------------------- */
export function Card({
  children,
  className,
  interactive = false,
}: {
  children: ReactNode
  className?: string
  interactive?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card text-card-foreground',
        interactive &&
          'transition-all duration-150 hover:border-primary/40 active:translate-y-px',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ----------------------------------------------------------------------------
 * SectionLabel — small all-caps scoreboard header
 * -------------------------------------------------------------------------- */
export function SectionLabel({
  children,
  action,
  className,
}: {
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex items-center justify-between', className)}>
      <h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
        {children}
      </h2>
      {action}
    </div>
  )
}

/* ----------------------------------------------------------------------------
 * StatTile — the core scoreboard cell
 * -------------------------------------------------------------------------- */
export function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
  className,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon?: LucideIcon
  accent?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col justify-between rounded-2xl border p-4',
        accent
          ? 'border-primary/30 bg-primary/5'
          : 'border-border bg-card',
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-1.5 text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        <span className="text-[0.7rem] font-bold uppercase tracking-wide">{label}</span>
      </div>
      <div>
        <div
          className={cn(
            'num text-3xl font-black leading-none',
            accent ? 'text-primary' : 'text-foreground',
          )}
        >
          {value}
        </div>
        {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------------------
 * ProgressMeter — used everywhere: ladder, seats, speaking time
 * -------------------------------------------------------------------------- */
export function ProgressMeter({
  value,
  max,
  tone = 'gold',
  className,
}: {
  value: number
  max: number
  tone?: 'gold' | 'danger' | 'muted'
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const tones = {
    gold: 'bg-primary',
    danger: 'bg-destructive',
    muted: 'bg-muted-foreground/50',
  }
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-elevated', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-300', tones[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
