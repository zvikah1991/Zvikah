import { useMemo } from "react";
import type { SalesRecord } from "../types";
import { computeKpis, monthOverMonth, monthlyPaceProjection } from "../lib/aggregations";
import { statusBucket } from "../lib/statusBuckets";
import { formatCurrency, formatMonthKeyShort, formatNumber, formatPercent } from "../lib/format";
import { useCountUp } from "../hooks/useCountUp";
import { StatTile } from "./ui/StatTile";
import { IconBriefcase, IconCheck, IconClock, IconCoins, IconTarget, IconTrendingUp, IconUsers, IconX } from "./ui/Icons";

export function KpiCards({ filtered, filteredIgnoringDate }: { filtered: SalesRecord[]; filteredIgnoringDate: SalesRecord[] }) {
  const kpis = useMemo(() => computeKpis(filtered, statusBucket), [filtered]);
  const mom = useMemo(() => monthOverMonth(filteredIgnoringDate), [filteredIgnoringDate]);
  const comparison = mom && mom.previousLabel ? mom : null;
  const pace = useMemo(() => monthlyPaceProjection(filteredIgnoringDate), [filteredIgnoringDate]);

  const premium = useCountUp(kpis.totalPremium);
  const deals = useCountUp(kpis.totalDeals);
  const avg = useCountUp(kpis.avgPremium);
  const customers = useCountUp(kpis.distinctCustomers);
  const winRate = useCountUp(kpis.winRate * 100);
  const projected = useCountUp(pace?.projectedPremium ?? 0);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
      <StatTile
        label="סה״כ פרמיה צפויה"
        value={formatCurrency(premium)}
        icon={<IconCoins />}
        delta={comparison ? { pct: comparison.premiumDeltaPct } : undefined}
        sub={comparison ? `${formatMonthKeyShort(comparison.currentLabel)} לעומת ${formatMonthKeyShort(comparison.previousLabel)}` : undefined}
      />
      {pace && (
        <StatTile
          label="פרמיה צפויה לפי קצב החודש"
          value={formatCurrency(projected)}
          icon={<IconTrendingUp />}
          delta={pace.previousMonthLabel ? { pct: pace.growthPct } : undefined}
          sub={
            pace.previousMonthLabel
              ? `לעומת אותה נקודה ב${formatMonthKeyShort(pace.previousMonthLabel)} · ${pace.daysElapsed} מתוך ${pace.daysInMonth} ימים`
              : pace.isProjecting
                ? `הערכה לפי ${pace.daysElapsed} מתוך ${pace.daysInMonth} ימים · ${formatMonthKeyShort(pace.monthLabel)}`
                : `${formatMonthKeyShort(pace.monthLabel)} הסתיים — זהה לבפועל`
          }
        />
      )}
      <StatTile
        label="עסקאות"
        value={formatNumber(Math.round(deals))}
        icon={<IconBriefcase />}
        delta={comparison ? { pct: comparison.countDeltaPct } : undefined}
        sub={comparison ? `${formatMonthKeyShort(comparison.currentLabel)} לעומת ${formatMonthKeyShort(comparison.previousLabel)}` : undefined}
      />
      <StatTile label="פרמיה ממוצעת לעסקה" value={formatCurrency(avg)} icon={<IconTarget />} />
      <StatTile label="לקוחות ייחודיים" value={formatNumber(Math.round(customers))} icon={<IconUsers />} />
      <StatTile
        label="הופק / הושלם"
        value={formatNumber(kpis.goodCount)}
        icon={<IconCheck />}
        accent="good"
        sub={`${formatPercent(winRate / 100)} אחוז הצלחה`}
      />
      <StatTile label="בוטל / נדחה" value={formatNumber(kpis.criticalCount)} icon={<IconX />} accent="critical" />
      <StatTile
        label="בטיפול"
        value={formatNumber(kpis.warningCount)}
        icon={<IconClock />}
        accent="warning"
        className="col-span-2 sm:col-span-1"
      />
    </div>
  );
}
