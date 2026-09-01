import { useMemo } from "react";
import clsx from "clsx";
import type { CategoryPoint } from "../lib/aggregations";
import { groupByField } from "../lib/aggregations";
import type { SalesRecord } from "../types";
import { formatCurrency, formatNumber } from "../lib/format";
import { Card } from "./ui/Card";
import { SectionTitle } from "./ui/SectionTitle";

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

/**
 * A performance report, not a game leaderboard: rank distinction comes from restrained
 * typographic and tonal weight (a quiet navy emphasis on first place) rather than gold
 * medals or confetti — closer to a private-banking statement than mobile-game chrome.
 */
function LeaderboardCard({ title, rows, delayMs }: { title: string; rows: CategoryPoint[]; delayMs?: number }) {
  const leader = rows[0];
  const rest = rows.slice(1, 8);
  const max = Math.max(1, ...rows.slice(0, 8).map((r) => r.premium));

  return (
    <Card className="hover-lift animate-fade-up p-5" style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}>
      <SectionTitle>{title}</SectionTitle>

      {!leader ? (
        <div className="grid h-32 place-items-center text-sm text-[var(--text-muted)]">אין נתונים להצגה</div>
      ) : (
        <div className="mt-3 flex flex-col gap-1">
          <div
            className="flex items-center gap-3.5 rounded-xl border-s-2 px-3.5 py-3"
            style={{
              borderInlineStartColor: "var(--brand)",
              background: "linear-gradient(160deg, color-mix(in oklab, var(--brand) 6%, var(--surface)) 0%, var(--surface) 70%)",
            }}
          >
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[15px] font-bold text-white"
              style={{ background: "var(--brand)" }}
            >
              1
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-bold text-[var(--text-primary)]">{leader.key}</div>
              <div className="text-xs text-[var(--text-muted)]">{formatNumber(leader.count)} עסקאות · מוביל/ה בטווח הנוכחי</div>
            </div>
            <div className="shrink-0 text-end text-lg font-bold tabular-nums text-[var(--brand-strong)]">{formatCurrency(leader.premium)}</div>
          </div>

          {rest.length > 0 && (
            <ul className="mt-1.5 flex flex-col gap-2.5 px-1">
              {rest.map((r, i) => {
                const width = Math.max(3, (r.premium / max) * 100);
                return (
                  <li key={r.key} className="flex items-center gap-3">
                    <span
                      className={clsx(
                        "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                        "bg-[var(--surface-2)] text-[var(--text-secondary)]",
                      )}
                    >
                      {i + 2}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium text-[var(--text-primary)]">{r.key}</span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--text-secondary)]">{formatCurrency(r.premium)}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                        <div
                          className="animate-grow-width h-full rounded-full bg-[var(--baseline)]"
                          style={
                            {
                              width: `${width}%`,
                              animationDelay: `${(delayMs ?? 0) + 150 + i * 55}ms`,
                              "--grow-to": `${width}%`,
                            } as React.CSSProperties
                          }
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
