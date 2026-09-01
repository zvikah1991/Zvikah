import { Card } from "./ui/Card";
import { IconCheck, IconClock, IconX } from "./ui/Icons";
import { formatCurrency, formatNumber } from "../lib/format";

/**
 * "Agency Momentum" — the pipeline's health as one segmented visual instead of three
 * identical white counter cards: how the funnel of decided/open deals actually splits,
 * at a glance, with the numbers that back it up alongside.
 */
export function AgencyMomentum({
  goodCount,
  goodPremium,
  warningCount,
  criticalCount,
  winRate,
  delayMs,
}: {
  goodCount: number;
  goodPremium: number;
  warningCount: number;
  criticalCount: number;
  winRate: number;
  delayMs?: number;
}) {
  const total = goodCount + warningCount + criticalCount;
  const seg = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  const segments = [
    { key: "good", label: "הופק / הושלם", count: goodCount, color: "var(--status-good)", icon: IconCheck },
    { key: "warning", label: "בטיפול", count: warningCount, color: "var(--status-warning)", icon: IconClock },
    { key: "critical", label: "בוטל / נדחה", count: criticalCount, color: "var(--status-critical)", icon: IconX },
  ] as const;

  return (
    <Card className="animate-fade-up p-5" style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase">קצב הפעילות — פילוח סטטוסים</p>
        <p className="text-xs text-[var(--text-muted)]">
          {formatNumber(total)} עסקאות · {formatPercentInline(winRate)} אחוז הצלחה מתוך המוכרעות
        </p>
      </div>

      <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-[var(--surface-2)]" role="img" aria-label="פילוח סטטוסים">
        {segments.map((s, i) => {
          const width = seg(s.count);
          if (width <= 0) return null;
          return (
            <div
              key={s.key}
              className="animate-grow-width h-full first:rounded-s-full last:rounded-e-full"
              style={
                {
                  width: `${width}%`,
                  background: s.color,
                  animationDelay: `${(delayMs ?? 0) + 150 + i * 90}ms`,
                  "--grow-to": `${width}%`,
                } as React.CSSProperties
              }
            />
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {segments.map((s) => (
          <div
            key={s.key}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
            style={{ background: `color-mix(in oklab, ${s.color} 7%, var(--surface-2))` }}
          >
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
              style={{ background: `color-mix(in oklab, ${s.color} 16%, transparent)`, color: s.color }}
            >
              <s.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="text-lg font-bold tabular-nums text-[var(--text-primary)]">{formatNumber(s.count)}</div>
              <div className="truncate text-xs text-[var(--text-muted)]">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {goodCount > 0 && (
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          <span className="font-medium text-[var(--text-secondary)]">{formatCurrency(goodPremium)}</span> פרמיה שכבר הופקה בפועל בטווח הנוכחי
        </p>
      )}
    </Card>
  );
}

function formatPercentInline(winRate: number): string {
  return `${Math.round(winRate)}%`;
}
