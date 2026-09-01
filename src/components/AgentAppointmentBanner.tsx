import { useMemo } from "react";
import type { SalesRecord } from "../types";
import { formatCurrency, formatNumber } from "../lib/format";
import { groupByField } from "../lib/aggregations";
import { IconBriefcase } from "./ui/Icons";

export function AgentAppointmentBanner({ records, delayMs }: { records: SalesRecord[]; delayMs?: number }) {
  const { count, premium } = useMemo(
    () => ({
      count: records.length,
      premium: records.reduce((sum, r) => sum + (r.expectedPremium ?? 0), 0),
    }),
    [records],
  );
  const byRep = useMemo(() => groupByField(records, "rep"), [records]);

  return (
    <div
      className="animate-fade-up flex flex-col gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)]/60 px-4 py-2.5 text-sm"
      style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--surface)] text-[var(--text-muted)]">
          <IconBriefcase className="h-3.5 w-3.5" />
        </span>
        <span className="font-medium">מינוי סוכן</span>
        <span className="text-[var(--text-muted)]">— בשורה נפרדת, לא נכלל בסה״כ הפרמיה הראשי</span>
        <span className="ms-auto flex items-center gap-4 tabular-nums">
          <span>
            <span className="text-[var(--text-muted)]">עסקאות: </span>
            <span className="font-medium">{formatNumber(count)}</span>
          </span>
          <span>
            <span className="text-[var(--text-muted)]">פרמיה: </span>
            <span className="font-medium">{formatCurrency(premium)}</span>
          </span>
        </span>
      </div>

      {byRep.length > 0 && (
        <div className="border-t border-dashed border-[var(--border)] pt-2">
          <table className="text-xs">
            <thead>
              <tr className="text-[var(--text-muted)]">
                <th className="pb-1 pe-4 text-start font-normal">נציג</th>
                <th className="pb-1 pe-4 text-end font-normal">עסקאות</th>
                <th className="pb-1 text-end font-normal">פרמיה</th>
              </tr>
            </thead>
            <tbody>
              {byRep.map((rep) => (
                <tr key={rep.key} className="border-t border-[var(--border)]">
                  <td className="py-1 pe-4 font-medium">{rep.key}</td>
                  <td className="py-1 pe-4 text-end tabular-nums text-[var(--text-secondary)]">{formatNumber(rep.count)}</td>
                  <td className="py-1 text-end font-medium tabular-nums">{formatCurrency(rep.premium)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
