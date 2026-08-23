import { useMemo, useState } from "react";
import type { KeywordPerfRecord } from "../../types";
import { keywordTotals, rankKeywords } from "../../lib/keywordAggregations";
import { formatCurrency, formatNumber } from "../../lib/format";
import { useCountUp } from "../../hooks/useCountUp";
import { Card } from "../ui/Card";
import { StatTile } from "../ui/StatTile";
import { IconGauge, IconPhone, IconTarget } from "../ui/Icons";

const PAGE_SIZE = 25;

const STATUS_LABEL: Record<string, string> = { under: "מתחת ליעד", over: "מעל היעד", "no-calls": "אין שיחות" };
const STATUS_COLOR: Record<string, string> = { under: "var(--status-good)", over: "var(--status-critical)", "no-calls": "var(--text-muted)" };

export function KeywordPerformanceTable({ records, targetCostPerCall }: { records: KeywordPerfRecord[]; targetCostPerCall: number }) {
  const [page, setPage] = useState(0);
  const totals = useMemo(() => keywordTotals(records), [records]);
  const rows = useMemo(() => rankKeywords(records, targetCostPerCall), [records, targetCostPerCall]);
  const overCount = rows.filter((r) => r.status === "over").length;

  const blended = useCountUp(totals.blendedCostPerCall ?? 0);
  const wasted = useCountUp(totals.wastedSpend);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="עלות ממוצעת לשיחה (בפועל)"
          value={totals.blendedCostPerCall !== null ? formatCurrency(blended) : "—"}
          icon={<IconGauge />}
          accentColor={totals.blendedCostPerCall !== null && totals.blendedCostPerCall > targetCostPerCall ? "var(--status-critical)" : "var(--status-good)"}
          sub={`יעד: ${formatCurrency(targetCostPerCall)} לשיחה`}
          delayMs={0}
        />
        <StatTile
          label="הוצאה על מילים ללא שיחות"
          value={formatCurrency(wasted)}
          icon={<IconTarget />}
          accentColor="var(--status-critical)"
          sub="מועמדות ראשונות להשהיה/צמצום"
          delayMs={50}
        />
        <StatTile
          label="מילות מפתח מעל היעד"
          value={`${formatNumber(overCount)} מתוך ${formatNumber(rows.length)}`}
          icon={<IconPhone />}
          accentColor="var(--status-warning)"
          sub="מומלץ להוריד הצעת מחיר או לצמצם התאמה"
          delayMs={100}
        />
      </div>

      <Card className="animate-fade-up overflow-hidden">
        <div className="border-b border-[var(--border)] p-4">
          <h3 className="text-sm font-semibold">ביצועים לפי מילת מפתח ({formatNumber(rows.length)})</h3>
          <p className="text-xs text-[var(--text-muted)]">
            ממוין מהיקר להוצאה ביותר · מילים באדום עולות מעל היעד — מועמדות להורדת הצעת מחיר, מעבר להתאמה מדויקת יותר, או השהיה
          </p>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                <th className="px-3 py-2 text-start font-medium">מילת מפתח</th>
                <th className="px-3 py-2 text-start font-medium">התאמה</th>
                <th className="px-3 py-2 text-end font-medium">קליקים</th>
                <th className="px-3 py-2 text-end font-medium">עלות</th>
                <th className="px-3 py-2 text-end font-medium">שיחות</th>
                <th className="px-3 py-2 text-end font-medium">עלות/שיחה</th>
                <th className="px-3 py-2 text-start font-medium">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr
                  key={`${r.keyword}__${r.matchType ?? ""}`}
                  className="border-b border-s-2 border-s-transparent border-[var(--border)] transition-colors last:border-b-0 hover:border-s-[var(--brand)] hover:bg-[var(--surface-2)]/60"
                >
                  <td className="max-w-56 truncate px-3 py-2 font-medium">{r.keyword}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-[var(--text-secondary)]">{r.matchType ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-end tabular-nums text-[var(--text-secondary)]">
                    {r.clicks !== null ? formatNumber(r.clicks) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-end tabular-nums">{formatCurrency(r.cost)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-end tabular-nums">{formatNumber(r.calls)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-end font-medium tabular-nums" style={{ color: STATUS_COLOR[r.status] }}>
                    {r.costPerCall !== null ? formatCurrency(r.costPerCall) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ background: `color-mix(in oklab, ${STATUS_COLOR[r.status]} 14%, transparent)`, color: STATUS_COLOR[r.status] }}
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: STATUS_COLOR[r.status] }} />
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-[var(--text-muted)]">
                    אין נתונים להצגה
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="flex items-center justify-between gap-2 p-3 text-sm">
            <span className="text-[var(--text-muted)]">
              עמוד {formatNumber(clampedPage + 1)} מתוך {formatNumber(pageCount)}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={clampedPage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-lg border border-[var(--border)] px-3 py-1 disabled:opacity-40"
              >
                הקודם
              </button>
              <button
                type="button"
                disabled={clampedPage >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="rounded-lg border border-[var(--border)] px-3 py-1 disabled:opacity-40"
              >
                הבא
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
