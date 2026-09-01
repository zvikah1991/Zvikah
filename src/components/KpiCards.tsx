import { useMemo } from "react";
import type { SalesRecord } from "../types";
import { computeKpis, monthlyTrend, monthOverMonth, monthlyPaceProjection } from "../lib/aggregations";
import { statusBucket } from "../lib/statusBuckets";
import { formatCurrency, formatMonthKeyShort, formatNumber, currentMonthKey as getCurrentMonthKey } from "../lib/format";
import { useCountUp } from "../hooks/useCountUp";
import { StatTile } from "./ui/StatTile";
import { RevenueHero } from "./ui/RevenueHero";
import { PaceModule } from "./ui/PaceModule";
import { AgencyMomentum } from "./AgencyMomentum";
import { IconTarget, IconUsers } from "./ui/Icons";

export function KpiCards({ filtered, filteredIgnoringDate }: { filtered: SalesRecord[]; filteredIgnoringDate: SalesRecord[] }) {
  const kpis = useMemo(() => computeKpis(filtered, statusBucket), [filtered]);
  const mom = useMemo(() => monthOverMonth(filteredIgnoringDate), [filteredIgnoringDate]);
  const comparison = mom && mom.previousLabel ? mom : null;
  const pace = useMemo(() => monthlyPaceProjection(filteredIgnoringDate), [filteredIgnoringDate]);

  const premium = useCountUp(kpis.totalPremium);
  const avg = useCountUp(kpis.avgPremium);
  const customers = useCountUp(kpis.distinctCustomers);
  const projected = useCountUp(pace?.projectedPremium ?? 0);

  const premiumTrend = useMemo(
    () => monthlyTrend(filteredIgnoringDate).slice(-6).map((p) => ({ monthKey: p.monthKey, premium: p.premium })),
    [filteredIgnoringDate],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="bento-hero-grid">
        <div className="area-hero">
          <RevenueHero
            label="פרמיה נוכחית — לפי הסינון הנוכחי"
            value={formatCurrency(premium)}
            delta={comparison ? { pct: comparison.premiumDeltaPct } : undefined}
            periodLabel={comparison ? `${formatMonthKeyShort(comparison.currentLabel)} מול ${formatMonthKeyShort(comparison.previousLabel)}` : undefined}
            dealsLabel={formatNumber(kpis.totalDeals)}
            avgLabel={formatCurrency(avg)}
            trend={premiumTrend}
            currentMonthKey={getCurrentMonthKey()}
            previousMonthPremium={comparison ? comparison.previousPremium : null}
          />
        </div>

        <div className="area-pace">
          {pace ? (
            <PaceModule
              projectedLabel={formatCurrency(projected)}
              growthPct={pace.previousMonthLabel ? pace.growthPct : null}
              monthLabel={pace.monthLabel}
              previousMonthLabel={pace.previousMonthLabel}
              daysElapsed={pace.daysElapsed}
              daysInMonth={pace.daysInMonth}
              isProjecting={pace.isProjecting}
              delayMs={60}
            />
          ) : (
            <StatTile label="קצב חודשי" value="—" icon={<IconTarget />} accentColor="var(--electric)" delayMs={60} />
          )}
        </div>

        <div className="area-customers">
          <StatTile label="לקוחות ייחודיים" value={formatNumber(Math.round(customers))} icon={<IconUsers />} accentColor="var(--series-3)" delayMs={100} />
        </div>

        <div className="area-avg">
          <StatTile label="פרמיה ממוצעת לעסקה" value={formatCurrency(avg)} icon={<IconTarget />} accentColor="var(--indigo)" delayMs={140} />
        </div>
      </div>

      <AgencyMomentum
        goodCount={kpis.goodCount}
        goodPremium={kpis.goodPremium}
        warningCount={kpis.warningCount}
        criticalCount={kpis.criticalCount}
        winRate={kpis.winRate * 100}
        delayMs={180}
      />
    </div>
  );
}
