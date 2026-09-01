import type { ReactNode } from "react";
import clsx from "clsx";
import { Card } from "./Card";

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
}: {
  label: string;
  value: string;
  sub?: string;
  /** CSS color (or var()) for this tile's icon and top accent bar. */
  accentColor?: string;
  delta?: { pct: number | null; positiveIsGood?: boolean } | null;
  icon?: ReactNode;
  className?: string;
  /** Staggers this tile's entrance animation behind the ones before it. */
  delayMs?: number;
  /** 0–1: renders a thin animated fill bar under the value (e.g. "days elapsed this month"). */
  progress?: number;
}) {
  const accentVar = accentColor ?? "var(--brand)";

  return (
    <Card
      className={clsx("hover-lift animate-fade-up flex h-full flex-col overflow-hidden p-3.5", className)}
      style={{
        ...(delayMs ? { animationDelay: `${delayMs}ms` } : undefined),
        background: `linear-gradient(160deg, color-mix(in oklab, ${accentVar} 6%, var(--surface)) 0%, var(--surface) 65%)`,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accentVar }} aria-hidden="true" />
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</span>
        {icon && (
          <span
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
            style={{ background: `color-mix(in oklab, ${accentVar} 14%, transparent)`, color: accentVar }}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-[24px] font-bold tracking-tight tabular-nums text-[var(--text-primary)]">{value}</span>
        {delta && delta.pct !== null && <DeltaBadge pct={delta.pct} positiveIsGood={delta.positiveIsGood ?? true} />}
      </div>
      {sub && <div className="mt-1 text-xs text-[var(--text-muted)]">{sub}</div>}
      {progress !== undefined && (
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-[var(--surface-2)]" aria-hidden="true">
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
    <span
      className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
      style={{ color, background: `color-mix(in oklab, ${color} 12%, transparent)` }}
    >
      <span className="text-[9px]">{arrow}</span>
      {Math.abs(pct * 100).toFixed(0)}%
    </span>
  );
}
