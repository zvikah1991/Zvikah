import { useMemo } from "react";
import clsx from "clsx";
import type { CategoryPoint } from "../lib/aggregations";
import { groupByField } from "../lib/aggregations";
import type { SalesRecord } from "../types";
import { formatCurrency, formatNumber } from "../lib/format";
import { Card } from "./ui/Card";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function filterByDateRange(records: SalesRecord[], from: string, to: string): SalesRecord[] {
  return records.filter((r) => r.requiredDate && r.requiredDate >= from && r.requiredDate <= to);
}

export function RepLeaderboard({ records, delayMs }: { records: SalesRecord[]; delayMs?: number }) {
  const { yearRows, monthRows } = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const todayISO = `${y}-${pad2(m)}-${pad2(today.getDate())}`;
    const yearFrom = `${y}-01-01`;
    const monthFrom = `${y}-${pad2(m)}-01`;
    return {
      yearRows: groupByField(filterByDateRange(records, yearFrom, todayISO), "rep"),
      monthRows: groupByField(filterByDateRange(records, monthFrom, todayISO), "rep"),
    };
  }, [records]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <LeaderboardCard title="טבלת מכירות — לפי פרמיה (מתחילת השנה)" rows={yearRows} delayMs={delayMs} />
      <LeaderboardCard title="טבלת מכירות — לפי פרמיה (חודשי)" rows={monthRows} delayMs={(delayMs ?? 0) + 60} />
    </div>
  );
}

function LeaderboardCard({ title, rows, delayMs }: { title: string; rows: CategoryPoint[]; delayMs?: number }) {
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3, 8);

  return (
    <Card className="hover-lift animate-fade-up p-4" style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}>
      <h3 className="text-sm font-semibold">{title}</h3>

      {podium.length === 0 ? (
        <div className="grid h-32 place-items-center text-sm text-[var(--text-muted)]">אין נתונים להצגה</div>
      ) : (
        <div className="mt-3 flex items-stretch gap-2">
          <PodiumTile rank={2} entry={podium[1]} className="order-1 mt-4" />
          <PodiumTile rank={1} entry={podium[0]} className="order-2" />
          <PodiumTile rank={3} entry={podium[2]} className="order-3 mt-6" />
        </div>
      )}

      {rest.length > 0 && (
        <table className="mt-3 w-full text-sm">
          <tbody>
            {rest.map((r, i) => (
              <tr
                key={r.key}
                className="border-t border-s-2 border-s-transparent border-[var(--border)] transition-colors hover:border-s-[var(--brand)] hover:bg-[var(--surface-2)]/60"
              >
                <td className="w-6 py-1.5 ps-1.5 text-xs tabular-nums text-[var(--text-muted)]">{i + 4}</td>
                <td className="truncate py-1.5">{r.key}</td>
                <td className="py-1.5 text-end tabular-nums text-[var(--text-muted)]">{formatNumber(r.count)} עסקאות</td>
                <td className="py-1.5 pe-1.5 text-end font-medium tabular-nums">{formatCurrency(r.premium)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

const RANK_STYLES: Record<1 | 2 | 3, { bg: string; border: string; lift: string }> = {
  1: { bg: "linear-gradient(135deg, #e9c874, var(--brand-gold))", border: "border-[var(--brand-gold)]/50", lift: "" },
  2: { bg: "linear-gradient(135deg, #d8dde3, #9aa3ad)", border: "border-[var(--border)]", lift: "" },
  3: { bg: "linear-gradient(135deg, #d8a878, #a9723f)", border: "border-[var(--border)]", lift: "" },
};

function PodiumTile({ rank, entry, className }: { rank: 1 | 2 | 3; entry?: CategoryPoint; className?: string }) {
  if (!entry) return <div className={clsx("flex-1", className)} aria-hidden="true" />;
  const style = RANK_STYLES[rank];

  return (
    <div
      className={clsx(
        "flex flex-1 flex-col items-center gap-1 rounded-xl border p-2.5 text-center",
        style.border,
        rank === 1 ? "bg-[color-mix(in_oklab,var(--brand-gold)_6%,var(--surface))]" : "bg-[var(--surface)]",
        className,
      )}
    >
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
        style={{ background: style.bg, boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }}
      >
        {rank}
      </span>
      <span className="w-full truncate text-sm font-medium">{entry.key}</span>
      <span className="text-base font-semibold tabular-nums">{formatCurrency(entry.premium)}</span>
      <span className="text-xs tabular-nums text-[var(--text-muted)]">{formatNumber(entry.count)} עסקאות</span>
    </div>
  );
}
