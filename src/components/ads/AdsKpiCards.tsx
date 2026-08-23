import { useMemo } from "react";
import type { AdsDayRecord } from "../../types";
import { computeAdsMonthlyPace, computeAdsSummary } from "../../lib/adsAggregations";
import { formatCurrency, formatMonthKeyShort, formatNumber, formatPercent } from "../../lib/format";
import { useCountUp } from "../../hooks/useCountUp";
import { StatTile } from "../ui/StatTile";
import { IconCoins, IconGauge, IconPhone, IconTarget } from "../ui/Icons";

export function AdsKpiCards({ records, monthlyBudget }: { records: AdsDayRecord[]; monthlyBudget: number }) {
  const summary = useMemo(() => computeAdsSummary(records), [records]);
  const pace = useMemo(() => computeAdsMonthlyPace(records, monthlyBudget), [records, monthlyBudget]);

  const spentSoFar = useCountUp(pace?.spentSoFar ?? 0);
  const projected = useCountUp(pace?.projectedSpend ?? 0);
  const calls = useCountUp(summary.totalCalls);
  const costPerCall = useCountUp(summary.costPerCall ?? 0);

  const paceAccent =
    pace?.status === "overspending" ? "var(--status-critical)" : pace?.status === "underspending" ? "var(--status-warning)" : "var(--status-good)";
  const paceLabel =
    pace?.status === "overspending" ? "מעל התקציב" : pace?.status === "underspending" ? "מתחת לתקציב" : "בקצב תקין";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatTile
        label="הוצאה עד כה החודש"
        value={formatCurrency(spentSoFar)}
        icon={<IconCoins />}
        accentColor="var(--series-1)"
        sub={pace ? `מתוך ${formatCurrency(monthlyBudget)} · יום ${pace.daysElapsed} מתוך ${pace.daysInMonth} (${formatMonthKeyShort(pace.monthKey)})` : undefined}
        progress={pace ? Math.min(1, pace.spentSoFar / monthlyBudget) : undefined}
        delayMs={0}
      />
      <StatTile
        label="תחזית הוצאה לסוף החודש"
        value={formatCurrency(projected)}
        icon={<IconGauge />}
        accentColor={paceAccent}
        sub={pace ? `${paceLabel} · ${formatPercent(pace.pctOfBudgetUsed)} מהתקציב` : undefined}
        delayMs={50}
      />
      <StatTile
        label="שיחות שהתקבלו"
        value={formatNumber(Math.round(calls))}
        icon={<IconPhone />}
        accentColor="var(--series-3)"
        sub="לפי כל הנתונים שהוזנו"
        delayMs={100}
      />
      <StatTile
        label="עלות ממוצעת לשיחה"
        value={summary.costPerCall !== null ? formatCurrency(costPerCall) : "—"}
        icon={<IconTarget />}
        accentColor="var(--series-7)"
        sub={summary.totalClicks !== null ? `${formatNumber(summary.totalClicks)} קליקים סה״כ` : undefined}
        delayMs={150}
      />
    </div>
  );
}
