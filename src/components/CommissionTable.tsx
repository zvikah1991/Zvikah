import { useMemo, useState } from "react";
import type { SalesRecord } from "../types";
import { computeCancellationChargebacks, computeRepCommissions, type RepCommission } from "../lib/aggregations";
import { statusBucket } from "../lib/statusBuckets";
import { formatCurrency, formatNumber, currentMonthKey, monthKeyOf, monthRangeISO, formatMonthKey } from "../lib/format";
import { Card } from "./ui/Card";
import { SectionTitle } from "./ui/SectionTitle";
import { IconCoins } from "./ui/Icons";

type CommissionRow = RepCommission & { chargebackAmount: number; cancelledPremium: number; cancelledDealCount: number; netTotal: number };

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
    // The current month is always selectable, even before any deal has closed in it yet —
    // otherwise a freshly-rolled-over month with no data of its own could never be viewed,
    // which would also hide that month's cancellation chargebacks (see below).
    set.add(currentMonthKey());
    for (const r of coreRecords) if (r.requiredDate) set.add(monthKeyOf(r.requiredDate));
    for (const r of agentAppointmentRecords) if (r.requiredDate) set.add(monthKeyOf(r.requiredDate));
    return Array.from(set).sort().reverse();
  }, [coreRecords, agentAppointmentRecords]);

  const defaultMonth = monthOptions.includes(currentMonthKey()) ? currentMonthKey() : (monthOptions[0] ?? currentMonthKey());
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  // Falls back gracefully if the underlying data changed (e.g. a new upload) and the previous selection no longer exists.
  const activeMonth = monthOptions.includes(selectedMonth) ? selectedMonth : defaultMonth;

  // Chargebacks claw back commission already paid in a prior month for deals cancelled
  // since — so they only ever apply to the current real month, not a retroactive view.
  const showChargebacks = activeMonth === currentMonthKey();

  const rows: CommissionRow[] = useMemo(() => {
    const { from, to } = monthRangeISO(activeMonth);
    const base = computeRepCommissions(activeMonth, inMonth(coreRecords, from, to), inMonth(agentAppointmentRecords, from, to), statusBucket);
    const chargebacks = showChargebacks ? computeCancellationChargebacks(coreRecords, statusBucket, activeMonth) : [];
    const chargebackByRep = new Map(chargebacks.map((c) => [c.rep, c]));

    const merged: CommissionRow[] = base.map((r) => {
      const cb = chargebackByRep.get(r.rep);
      chargebackByRep.delete(r.rep);
      return {
        ...r,
        chargebackAmount: cb?.chargebackAmount ?? 0,
        cancelledPremium: cb?.cancelledPremium ?? 0,
        cancelledDealCount: cb?.dealCount ?? 0,
        netTotal: r.totalCommission - (cb?.chargebackAmount ?? 0),
      };
    });
    // Reps with a chargeback but no other commission this month still need to be visible.
    for (const cb of chargebackByRep.values()) {
      merged.push({
        rep: cb.rep,
        issuedPremium: 0,
        multiplier: 0,
        isManualMultiplier: false,
        issuedCommission: 0,
        agentAppointmentPremium: 0,
        agentAppointmentCommission: 0,
        totalCommission: 0,
        chargebackAmount: cb.chargebackAmount,
        cancelledPremium: cb.cancelledPremium,
        cancelledDealCount: cb.dealCount,
        netTotal: -cb.chargebackAmount,
      });
    }
    return merged.sort((a, b) => b.netTotal - a.netTotal);
  }, [coreRecords, agentAppointmentRecords, activeMonth, showChargebacks]);

  const totalBonus = rows.reduce((sum, r) => sum + r.netTotal, 0);
  const topEarner = rows.length > 0 ? rows.reduce((a, b) => (b.netTotal > a.netTotal ? b : a)) : null;

  return (
    <Card className="animate-fade-up overflow-hidden p-5" style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <SectionTitle>עמלות נציגים</SectionTitle>
          <p className="mt-0.5 max-w-xl text-xs text-[var(--text-muted)]">
            פרמיה שהופקה בחודש הנבחר × מדרגת העמלה, ועוד חצי עמלה על פרמיית מינוי סוכן · לא כולל את בעל הסוכנות · ניתן לחזור רטרואקטיבית לכל חודש
            {showChargebacks && " · כולל קיזוז עמלות על עסקאות שבוטלו וסומנו כ״מבוטל״, שנמכרו בשנה האחרונה"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={activeMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium outline-none"
          >
            {monthOptions.length === 0 && <option value={activeMonth}>{formatMonthKey(activeMonth)}</option>}
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {formatMonthKey(m)}
              </option>
            ))}
          </select>

          <div
            className="flex items-center gap-2.5 rounded-xl px-3.5 py-2"
            style={{ background: "linear-gradient(160deg, color-mix(in oklab, var(--electric) 8%, var(--surface-2)) 0%, var(--surface-2) 100%)" }}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--electric)_16%,transparent)] text-[var(--electric)]">
              <IconCoins className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <div className="text-[11px] text-[var(--text-muted)]">סה״כ עמלות</div>
              <div
                className="text-lg font-bold tabular-nums"
                style={{ color: totalBonus < 0 ? "var(--status-critical)" : "var(--text-primary)" }}
              >
                {formatCurrency(totalBonus)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)]">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="bg-[var(--surface-2)] text-xs text-[var(--text-muted)]">
                <th className="py-2.5 ps-3.5 pe-3 text-start font-medium">נציג</th>
                <th className="py-2.5 pe-3 text-end font-medium">פרמיה שהופקה</th>
                <th className="py-2.5 pe-3 text-end font-medium">מדרגה</th>
                <th className="py-2.5 pe-3 text-end font-medium">עמלת ליבה</th>
                <th className="py-2.5 pe-3 text-end font-medium">פרמיית מינוי סוכן</th>
                <th className="py-2.5 pe-3 text-end font-medium">עמלת מינוי סוכן</th>
                {showChargebacks && <th className="py-2.5 pe-3 text-end font-medium">ביטולים (קיזוז)</th>}
                <th className="py-2.5 pe-3.5 text-end font-medium">סה״כ בונוס</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isTop = topEarner && r.rep === topEarner.rep && r.netTotal > 0;
                return (
                  <tr
                    key={r.rep}
                    className="border-t border-[var(--border)] transition-colors hover:bg-[var(--surface-2)]/60"
                    style={isTop ? { background: "color-mix(in oklab, var(--electric) 4%, transparent)" } : undefined}
                  >
                    <td className="py-2.5 ps-3.5 pe-3 font-semibold text-[var(--text-primary)]">{r.rep}</td>
                    <td className="py-2.5 pe-3 text-end tabular-nums">{formatCurrency(r.issuedPremium)}</td>
                    <td className="py-2.5 pe-3 text-end tabular-nums text-[var(--text-secondary)]">
                      <span className="inline-flex items-center gap-1">
                        ×{r.multiplier}
                        {r.isManualMultiplier && (
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                            style={{ color: "var(--status-warning)", background: "color-mix(in oklab, var(--status-warning) 14%, transparent)" }}
                            title="מדרגה ידנית, לא מהטבלה הרגילה"
                          >
                            ידני
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 pe-3 text-end tabular-nums">{formatCurrency(r.issuedCommission)}</td>
                    <td className="py-2.5 pe-3 text-end tabular-nums text-[var(--text-secondary)]">{formatCurrency(r.agentAppointmentPremium)}</td>
                    <td className="py-2.5 pe-3 text-end tabular-nums text-[var(--text-secondary)]">{formatCurrency(r.agentAppointmentCommission)}</td>
                    {showChargebacks && (
                      <td className="py-2.5 pe-3 text-end tabular-nums">
                        {r.chargebackAmount > 0 ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-semibold"
                            style={{ color: "var(--status-critical)", background: "color-mix(in oklab, var(--status-critical) 12%, transparent)" }}
                            title={`${formatNumber(r.cancelledDealCount)} עסקאות שבוטלו · פרמיה מקורית ${formatCurrency(r.cancelledPremium)}`}
                          >
                            −{formatCurrency(r.chargebackAmount)}
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)]">—</span>
                        )}
                      </td>
                    )}
                    <td
                      className="py-2.5 pe-3.5 text-end font-bold tabular-nums"
                      style={{ color: r.netTotal < 0 ? "var(--status-critical)" : "var(--brand-strong)" }}
                    >
                      {formatCurrency(r.netTotal)}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={showChargebacks ? 8 : 7} className="py-6 text-center text-[var(--text-muted)]">
                    אין נתונים לחודש שנבחר
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
