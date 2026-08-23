import type { AdsDayRecord } from "../types";

export interface AdsSummary {
  totalCost: number;
  totalCalls: number;
  totalClicks: number | null;
  totalImpressions: number | null;
  costPerCall: number | null;
  ctr: number | null; // clicks / impressions
}

export function computeAdsSummary(records: AdsDayRecord[]): AdsSummary {
  const totalCost = records.reduce((s, r) => s + r.cost, 0);
  const totalCalls = records.reduce((s, r) => s + r.calls, 0);
  const hasClicks = records.some((r) => r.clicks !== null);
  const hasImpr = records.some((r) => r.impressions !== null);
  const totalClicks = hasClicks ? records.reduce((s, r) => s + (r.clicks ?? 0), 0) : null;
  const totalImpressions = hasImpr ? records.reduce((s, r) => s + (r.impressions ?? 0), 0) : null;

  return {
    totalCost,
    totalCalls,
    totalClicks,
    totalImpressions,
    costPerCall: totalCalls > 0 ? totalCost / totalCalls : null,
    ctr: totalClicks !== null && totalImpressions ? totalClicks / totalImpressions : null,
  };
}

export interface AdsDailyPoint {
  date: string;
  cost: number;
  calls: number;
  cumulativeCost: number;
  budgetPace: number; // straight-line budget target through this day of the month
}

/** Restricts to one calendar month (yyyy-mm) and adds a cumulative-spend + straight-line budget-pace series. */
export function adsMonthlyTrend(records: AdsDayRecord[], monthKey: string, monthlyBudget: number): AdsDailyPoint[] {
  const [y, m] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const byDate = new Map(records.filter((r) => r.date.startsWith(monthKey)).map((r) => [r.date, r]));

  const points: AdsDailyPoint[] = [];
  let cumulative = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${monthKey}-${String(day).padStart(2, "0")}`;
    const rec = byDate.get(date);
    cumulative += rec?.cost ?? 0;
    points.push({
      date,
      cost: rec?.cost ?? 0,
      calls: rec?.calls ?? 0,
      cumulativeCost: cumulative,
      budgetPace: (monthlyBudget / daysInMonth) * day,
    });
  }
  return points;
}

export interface AdsMonthlyPace {
  monthKey: string;
  daysElapsed: number;
  daysInMonth: number;
  spentSoFar: number;
  targetSoFar: number;
  projectedSpend: number;
  monthlyBudget: number;
  pctOfBudgetUsed: number;
  status: "on-track" | "overspending" | "underspending";
}

/**
 * Projects the latest month present in the data to a full-month spend based on
 * its pace so far, and flags whether that's tracking to over/under the monthly
 * budget target — the number a business owner actually needs to catch a runaway
 * campaign before the bill arrives, without waiting for the marketer's report.
 */
export function computeAdsMonthlyPace(records: AdsDayRecord[], monthlyBudget: number): AdsMonthlyPace | null {
  if (records.length === 0) return null;
  const latestDate = records.reduce((max, r) => (r.date > max ? r.date : max), records[0].date);
  const monthKey = latestDate.slice(0, 7);
  const daysElapsed = Number(latestDate.slice(8, 10));
  const [y, m] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();

  const spentSoFar = records.filter((r) => r.date.startsWith(monthKey) && r.date <= latestDate).reduce((s, r) => s + r.cost, 0);
  const targetSoFar = (monthlyBudget / daysInMonth) * daysElapsed;
  const projectedSpend = daysElapsed > 0 ? (spentSoFar / daysElapsed) * daysInMonth : 0;

  const pctOfBudgetUsed = monthlyBudget > 0 ? projectedSpend / monthlyBudget : 0;
  const status: AdsMonthlyPace["status"] = pctOfBudgetUsed > 1.08 ? "overspending" : pctOfBudgetUsed < 0.85 ? "underspending" : "on-track";

  return { monthKey, daysElapsed, daysInMonth, spentSoFar, targetSoFar, projectedSpend, monthlyBudget, pctOfBudgetUsed, status };
}

/** Distinct yyyy-mm keys present in the data, most recent first. */
export function distinctAdsMonths(records: AdsDayRecord[]): string[] {
  const set = new Set(records.map((r) => r.date.slice(0, 7)));
  return Array.from(set).sort().reverse();
}
