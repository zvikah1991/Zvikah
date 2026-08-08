import type { ReactNode } from "react";
import clsx from "clsx";
import { Card } from "./Card";

export function StatTile({
  label,
  value,
  sub,
  accent,
  delta,
  icon,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "good" | "warning" | "critical" | "neutral";
  delta?: { pct: number | null; positiveIsGood?: boolean } | null;
  icon?: ReactNode;
  className?: string;
}) {
  const accentVar = accent
    ? {
        good: "var(--status-good)",
        warning: "var(--status-warning)",
        critical: "var(--status-critical)",
        neutral: "var(--series-1)",
      }[accent]
    : "var(--series-1)";

  return (
    <Card className={clsx("animate-fade-up p-4", className)}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
        {icon && (
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
            style={{ background: `color-mix(in oklab, ${accentVar} 16%, transparent)`, color: accentVar }}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {delta && delta.pct !== null && <DeltaBadge pct={delta.pct} positiveIsGood={delta.positiveIsGood ?? true} />}
      </div>
      {sub && <div className="mt-1 text-xs text-[var(--text-muted)]">{sub}</div>}
    </Card>
  );
}

function DeltaBadge({ pct, positiveIsGood }: { pct: number; positiveIsGood: boolean }) {
  const isPositive = pct >= 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;
  const color = isGood ? "var(--success-text)" : "var(--status-critical)";
  const arrow = isPositive ? "▲" : "▼";
  return (
    <span className="flex items-center gap-0.5 text-xs font-medium tabular-nums" style={{ color }}>
      <span className={clsx("text-[10px]")}>{arrow}</span>
      {Math.abs(pct * 100).toFixed(0)}%
    </span>
  );
}
