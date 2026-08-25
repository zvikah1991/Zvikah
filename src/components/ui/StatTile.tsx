import type { ReactNode } from "react";
import clsx from "clsx";
import { Card } from "./Card";
import { Sparkline } from "./Sparkline";

export function StatTile({
  label,
  value,
  sub,
  accentColor,
  delta,
  icon,
  className,
  delayMs,
  progress,
  sparkline,
}: {
  label: string;
  value: string;
  sub?: string;
  /** CSS color (or var()) used for this tile's border, icon badge, and progress/sparkline accent. */
  accentColor?: string;
  delta?: { pct: number | null; positiveIsGood?: boolean } | null;
  icon?: ReactNode;
  className?: string;
  /** Staggers this tile's entrance animation behind the ones before it. */
  delayMs?: number;
  /** 0–1: renders a thin animated fill bar under the value (e.g. "days elapsed this month"). */
  progress?: number;
  /** Recent trend points (oldest→newest) rendered as a small inline line chart. */
  sparkline?: number[];
}) {
  const accentVar = accentColor ?? "var(--brand)";

  return (
    <Card
      className={clsx("hover-lift animate-fade-up overflow-hidden p-4", className)}
      style={{
        ...(delayMs ? { animationDelay: `${delayMs}ms` } : undefined),
        borderColor: `color-mix(in oklab, ${accentVar} 45%, var(--border))`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
        {icon && (
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
            style={{
              background: `color-mix(in oklab, ${accentVar} 18%, transparent)`,
              color: accentVar,
              boxShadow: `0 0 0 1px color-mix(in oklab, ${accentVar} 35%, transparent), 0 6px 16px -6px color-mix(in oklab, ${accentVar} 65%, transparent)`,
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-[28px] font-extrabold tracking-tight tabular-nums">{value}</span>
        {delta && delta.pct !== null && <DeltaBadge pct={delta.pct} positiveIsGood={delta.positiveIsGood ?? true} />}
      </div>
      {sub && <div className="mt-1 text-xs text-[var(--text-muted)]">{sub}</div>}
      {sparkline && sparkline.length >= 2 && (
        <div className="mt-2 -mb-1">
          <Sparkline data={sparkline} color={accentVar} />
        </div>
      )}
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
