import { useMemo } from "react";
import type { SalesRecord } from "../types";
import { monthlyPaceProjection } from "../lib/aggregations";
import { formatCurrency, formatMonthKeyShort } from "../lib/format";
import { IconTrendingUp } from "./ui/Icons";

export function InsightBanner({ records, delayMs }: { records: SalesRecord[]; delayMs?: number }) {
  const pace = useMemo(() => monthlyPaceProjection(records), [records]);

  if (!pace || pace.growthPct === null || !pace.previousMonthLabel) return null;

  const isUp = pace.growthPct >= 0;
  const pct = Math.abs(Math.round(pace.growthPct * 100));
  const accent = isUp ? "var(--status-good)" : "var(--status-critical)";

  return (
    <div
      className="animate-fade-up flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
      style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
        style={{ background: `color-mix(in oklab, ${accent} 16%, transparent)`, color: accent }}
        aria-hidden="true"
      >
        <IconTrendingUp className={isUp ? "" : "rotate-180"} />
      </span>
      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
        <strong className="text-[var(--text-primary)]">
          {formatMonthKeyShort(pace.monthLabel)} {isUp ? "מתקדם" : "מפגר"} ב-{pct}%
        </strong>{" "}
        לעומת אותה נקודה ב{formatMonthKeyShort(pace.previousMonthLabel)} · קצב נוכחי מוביל ל-{formatCurrency(Math.round(pace.projectedPremium))} עד סוף
        החודש
      </p>
    </div>
  );
}
