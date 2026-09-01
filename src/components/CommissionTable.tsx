import { useMemo } from "react";
import type { SalesRecord } from "../types";
import { computeRepCommissions } from "../lib/aggregations";
import { statusBucket } from "../lib/statusBuckets";
import { formatCurrency, currentMonthKey, monthRangeISO, todayISO, formatMonthKey } from "../lib/format";
import { Card } from "./ui/Card";
import { SectionTitle } from "./ui/SectionTitle";

function inCurrentMonth(records: SalesRecord[], monthFrom: string, today: string): SalesRecord[] {
  return records.filter((r) => r.requiredDate && r.requiredDate >= monthFrom && r.requiredDate <= today);
}

export function CommissionTable({
  coreRecords,
  agentAppointmentRecords,
  delayMs,
}: {
  coreRecords: SalesRecord[];
  agentAppointmentRecords: SalesRecord[];
  delayMs?: number;
}) {
  const monthKey = currentMonthKey();

  const rows = useMemo(() => {
    const { from } = monthRangeISO(monthKey);
    const today = todayISO();
    return computeRepCommissions(inCurrentMonth(coreRecords, from, today), inCurrentMonth(agentAppointmentRecords, from, today), statusBucket);
  }, [coreRecords, agentAppointmentRecords, monthKey]);

  const totalBonus = rows.reduce((sum, r) => sum + r.totalCommission, 0);

  return (
    <Card className="animate-fade-up overflow-hidden p-4" style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <SectionTitle>עמלות נציגים — {formatMonthKey(monthKey)}</SectionTitle>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            פרמיה שהופקה החודש × מדרגת העמלה, ועוד חצי עמלה על פרמיית מינוי סוכן · לא כולל את בעל הסוכנות
          </p>
        </div>
        <div className="text-end">
          <div className="text-xs text-[var(--text-muted)]">סה״כ עמלות החודש</div>
          <div className="text-lg font-bold tabular-nums">{formatCurrency(totalBonus)}</div>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
              <th className="py-1.5 pe-3 text-start font-normal">נציג</th>
              <th className="py-1.5 pe-3 text-end font-normal">פרמיה שהופקה</th>
              <th className="py-1.5 pe-3 text-end font-normal">מדרגה</th>
              <th className="py-1.5 pe-3 text-end font-normal">עמלת ליבה</th>
              <th className="py-1.5 pe-3 text-end font-normal">פרמיית מינוי סוכן</th>
              <th className="py-1.5 pe-3 text-end font-normal">עמלת מינוי סוכן</th>
              <th className="py-1.5 text-end font-normal">סה״כ בונוס</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.rep} className="border-b border-[var(--border)] last:border-0">
                <td className="py-1.5 pe-3 font-medium">{r.rep}</td>
                <td className="py-1.5 pe-3 text-end tabular-nums">{formatCurrency(r.issuedPremium)}</td>
                <td className="py-1.5 pe-3 text-end tabular-nums text-[var(--text-secondary)]">×{r.multiplier}</td>
                <td className="py-1.5 pe-3 text-end tabular-nums">{formatCurrency(r.issuedCommission)}</td>
                <td className="py-1.5 pe-3 text-end tabular-nums text-[var(--text-secondary)]">{formatCurrency(r.agentAppointmentPremium)}</td>
                <td className="py-1.5 pe-3 text-end tabular-nums text-[var(--text-secondary)]">{formatCurrency(r.agentAppointmentCommission)}</td>
                <td className="py-1.5 text-end font-bold tabular-nums">{formatCurrency(r.totalCommission)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-[var(--text-muted)]">
                  אין נתונים לחודש הנוכחי
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
