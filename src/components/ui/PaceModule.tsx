import { Card } from "./Card";
import { IconTrendingUp } from "./Icons";
import { formatMonthKeyShort } from "../../lib/format";

/**
 * "Pace" — a tall, narrow companion to the Revenue Pulse hero: how far through the month we
 * are (ring gauge) set directly against where premium is projected to land, and how that
 * compares to the same point last month. Replaces the old flat InsightBanner sentence.
 */
export function PaceModule({
  projectedLabel,
  growthPct,
  monthLabel,
  previousMonthLabel,
  daysElapsed,
  daysInMonth,
  isProjecting,
  delayMs,
}: {
  projectedLabel: string;
  growthPct: number | null;
  monthLabel: string;
  previousMonthLabel: string | null;
  daysElapsed: number;
  daysInMonth: number;
  isProjecting: boolean;
  delayMs?: number;
}) {
  const pct = daysInMonth > 0 ? Math.round((daysElapsed / daysInMonth) * 100) : 0;
  const isUp = growthPct !== null && growthPct >= 0;
  const ringColor = "var(--electric)";

  return (
    <Card
      className="animate-fade-up flex h-full flex-col items-center justify-center gap-3 p-5 text-center"
      style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      <div className="flex items-center gap-1.5 self-start text-[11px] font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase">
        <IconTrendingUp className="h-3.5 w-3.5" />
        קצב {formatMonthKeyShort(monthLabel)}
      </div>

      <div className="relative h-24 w-24 shrink-0" style={{ "--pct": pct, "--ring-color": ringColor } as React.CSSProperties}>
        <div className="ring-progress absolute inset-0" />
        <div className="absolute inset-[7px] grid place-items-center rounded-full bg-[var(--surface)]">
          <span className="text-base font-bold tabular-nums text-[var(--text-primary)]">{pct}%</span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {daysElapsed}/{daysInMonth} ימים
          </span>
        </div>
      </div>

      <div>
        <div className="text-xl font-bold tabular-nums text-[var(--brand-strong)]">{projectedLabel}</div>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{isProjecting ? "פרמיה צפויה עד סוף החודש" : "פרמיה סופית לחודש"}</p>
      </div>

      {growthPct !== null && previousMonthLabel && (
        <span
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"
          style={{
            color: isUp ? "var(--success-text)" : "var(--status-critical)",
            background: `color-mix(in oklab, ${isUp ? "var(--success-text)" : "var(--status-critical)"} 12%, transparent)`,
          }}
        >
          <span className="text-[10px]">{isUp ? "▲" : "▼"}</span>
          {Math.abs(Math.round(growthPct * 100))}% מול {formatMonthKeyShort(previousMonthLabel)}
        </span>
      )}
    </Card>
  );
}
