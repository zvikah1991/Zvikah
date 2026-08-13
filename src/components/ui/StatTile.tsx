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
  delayMs,
  progress,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "good" | "warning" | "critical" | "neutral";
  delta?: { pct: number | null; positiveIsGood?: boolean } | null;
  icon?: ReactNode;
  className?: string;
  /** Staggers this tile's entrance animation behind the ones before it. */
  delayMs?: number;
  /** 0–1: renders a thin animated fill bar under the value (e.g. "days elapsed this month"). */
  progress?: number;
}) {
  const accentVar = accent
    ? {
        good: "var(--status-good)",
        warning: "var(--status-warning)",
        critical: "var(--status-critical)",
        neutral: "var(--brand)",
      }[accent]
    : "var(--brand)";

  return (
    <Card className={clsx("animate-fade-up overflow-hidden p-4", className)} style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}>
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: "linear-gradient(90deg, transparent, var(--brand-gold-soft), transparent)" }}
        aria-hidden="true"
      />
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
      {progress !== undefined && (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--surface-2)]" aria-hidden="true">
          <div
            className="animate-grow-width h-full rounded-full"
            style={
              {
                width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`,
                background: accentVar,
                animationDelay: delayMs ? `${delayMs + 150}ms` : "150ms",
                "--grow-to": `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`,
              } as React.CSSProperties
            }
          />
        </div>
      )}
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
