import { Card } from "./Card";
import { Sparkline } from "./Sparkline";

/** Oversized featured headline metric — the dashboard's single most important number, given its own dramatic moment above the KPI grid. */
export function HeroStat({
  label,
  value,
  sub,
  delta,
  sparkline,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: { pct: number | null; positiveIsGood?: boolean } | null;
  sparkline?: number[];
}) {
  const isPositive = delta && delta.pct !== null ? delta.pct >= 0 : null;
  const isGood = isPositive === null ? null : (delta?.positiveIsGood ?? true) ? isPositive : !isPositive;
  const deltaColor = isGood === null ? undefined : isGood ? "var(--success-text)" : "var(--status-critical)";

  return (
    <Card className="animate-fade-up overflow-hidden p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            <span className="gradient-text font-serif text-5xl font-bold tracking-tight sm:text-6xl">{value}</span>
            {delta && delta.pct !== null && (
              <span className="flex items-center gap-1 text-base font-semibold tabular-nums" style={{ color: deltaColor }}>
                <span className="text-sm">{isPositive ? "▲" : "▼"}</span>
                {Math.abs(delta.pct * 100).toFixed(0)}%
              </span>
            )}
          </div>
          {sub && <p className="mt-2 text-sm text-[var(--text-secondary)]">{sub}</p>}
        </div>
        {sparkline && sparkline.length >= 2 && (
          <div className="h-16 w-full max-w-sm sm:w-72">
            <Sparkline data={sparkline} color="var(--series-1)" height={56} />
          </div>
        )}
      </div>
    </Card>
  );
}
