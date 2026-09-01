import { useMemo, useState } from "react";
import type { SalesRecord } from "../types";
import { computeRepCommissions } from "../lib/aggregations";
import { statusBucket } from "../lib/statusBuckets";
import { formatCurrency, currentMonthKey, monthKeyOf, monthRangeISO, formatMonthKey } from "../lib/format";
import { Card } from "./ui/Card";
import { SectionTitle } from "./ui/SectionTitle";

function inMonth(records: SalesRecord[], from: string, to: string): SalesRecord[] {
  return records.filter((r) => r.requiredDate && r.requiredDate >= from && r.requiredDate <= to);
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
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of coreRecords) if (r.requiredDate) set.add(monthKeyOf(r.requiredDate));
    for (const r of agentAppointmentRecords) if (r.requiredDate) set.add(monthKeyOf(r.requiredDate));
    return Array.from(set).sort().reverse();
  }, [coreRecords, agentAppointmentRecords]);

  const defaultMonth = monthOptions.includes(currentMonthKey()) ? currentMonthKey() : (monthOptions[0] ?? currentMonthKey());
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  // Falls back gracefully if the underlying data changed (e.g. a new upload) and the previous selection no longer exists.
  const activeMonth = monthOptions.includes(selectedMonth) ? selectedMonth : defaultMonth;

  const rows = useMemo(() => {
    const { from, to } = monthRangeISO(activeMonth);
    return computeRepCommissions(inMonth(coreRecords, from, to), inMonth(agentAppointmentRecords, from, to), statusBucket);
  }, [coreRecords, agentAppointmentRecords, activeMonth]);

  const totalBonus = rows.reduce((sum, r) => sum + r.totalCommission, 0);

  return (
    <Card className="animate-fade-up overflow-hidden p-4" style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <SectionTitle>עמלות נציגים</SectionTitle>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            פרמיה שהופקה בחודש הנבחר × מדרגת העמלה, ועוד חצי עמלה על פרמיית מינוי סוכן · לא כולל את בעל הסוכנות · ניתן לחזור רטרואקטיבית לכל חודש
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={activeMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm outline-none"
          >
            {monthOptions.length === 0 && <option value={activeMonth}>{formatMonthKey(activeMonth)}</option>}
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {formatMonthKey(m)}
              </option>
            ))}
          </select>
          <div className="text-end">
            <div className="text-xs text-[var(--text-muted)]">סה״כ עמלות</div>
            <div className="text-lg font-bold tabular-nums">{formatCurrency(totalBonus)}</div>
          </div>
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
                  אין נתונים לחודש שנבחר
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
