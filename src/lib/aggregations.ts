import type { Filters, SalesRecord } from "../types";
import { monthKeyOf } from "./format";

export function applyFilters(records: SalesRecord[], filters: Filters, opts?: { ignoreDate?: boolean }): SalesRecord[] {
  const search = filters.search.trim().toLowerCase();
  return records.filter((r) => {
    if (!opts?.ignoreDate) {
      if (filters.dateFrom && (!r.requiredDate || r.requiredDate < filters.dateFrom)) return false;
      if (filters.dateTo && (!r.requiredDate || r.requiredDate > filters.dateTo)) return false;
    }
    if (filters.reps.length && !(r.rep && filters.reps.includes(r.rep))) return false;
    if (filters.statuses.length && !(r.status && filters.statuses.includes(r.status))) return false;
    if (filters.processTypes.length && !(r.processType && filters.processTypes.includes(r.processType))) return false;
    if (filters.insurers.length && !(r.insurer && filters.insurers.includes(r.insurer))) return false;
    if (filters.productTypes.length && !(r.productType && filters.productTypes.includes(r.productType))) return false;
    if (search) {
      const haystack = `${r.customer ?? ""} ${r.rep ?? ""} ${r.insurer ?? ""}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export interface MonthPoint {
  monthKey: string;
  label: string;
  premium: number;
  count: number;
}

/** Groups records by month (yyyy-mm) of requiredDate, filling gaps so the trend line has no holes. */
export function monthlyTrend(records: SalesRecord[]): MonthPoint[] {
  const withDate = records.filter((r): r is SalesRecord & { requiredDate: string } => !!r.requiredDate);
  if (withDate.length === 0) return [];

  const byMonth = new Map<string, { premium: number; count: number }>();
  for (const r of withDate) {
    const key = monthKeyOf(r.requiredDate);
    const bucket = byMonth.get(key) ?? { premium: 0, count: 0 };
    bucket.premium += r.expectedPremium ?? 0;
    bucket.count += 1;
    byMonth.set(key, bucket);
  }

  const keys = Array.from(byMonth.keys()).sort();
  const [minY, minM] = keys[0].split("-").map(Number);
  const [maxY, maxM] = keys[keys.length - 1].split("-").map(Number);

  const points: MonthPoint[] = [];
  let y = minY;
  let m = minM;
  while (y < maxY || (y === maxY && m <= maxM)) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    const bucket = byMonth.get(key) ?? { premium: 0, count: 0 };
    points.push({ monthKey: key, label: key, premium: bucket.premium, count: bucket.count });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return points;
}

export interface CategoryPoint {
  key: string;
  premium: number;
  count: number;
}

export function groupByField(records: SalesRecord[], field: "rep" | "status" | "processType" | "insurer" | "productType"): CategoryPoint[] {
  const byKey = new Map<string, { premium: number; count: number }>();
  for (const r of records) {
    const value = r[field];
    const key = value ?? "לא צוין";
    const bucket = byKey.get(key) ?? { premium: 0, count: 0 };
    bucket.premium += r.expectedPremium ?? 0;
    bucket.count += 1;
    byKey.set(key, bucket);
  }
  return Array.from(byKey.entries())
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.premium - a.premium);
}

export function sortByMetric(points: CategoryPoint[], metric: "premium" | "count"): CategoryPoint[] {
  return points.slice().sort((a, b) => (metric === "premium" ? b.premium - a.premium : b.count - a.count));
}

const OTHER_LABEL = "אחר";

/** Keeps the top N categories by premium, folding the remainder into a single "Other" bucket. */
export function topNWithOther(points: CategoryPoint[], n: number): CategoryPoint[] {
  if (points.length <= n) return points;
  const head = points.slice(0, n);
  const tail = points.slice(n);
  const other = tail.reduce(
    (acc, p) => ({ key: OTHER_LABEL, premium: acc.premium + p.premium, count: acc.count + p.count }),
    { key: OTHER_LABEL, premium: 0, count: 0 },
  );
  return [...head, other];
}

export interface Kpis {
  totalDeals: number;
  totalPremium: number;
  avgPremium: number;
  distinctCustomers: number;
  goodCount: number;
  warningCount: number;
  criticalCount: number;
  winRate: number;
}

export function computeKpis(records: SalesRecord[], bucketOf: (status: string | null) => string): Kpis {
  const totalDeals = records.length;
  const totalPremium = records.reduce((sum, r) => sum + (r.expectedPremium ?? 0), 0);
  const customers = new Set(records.map((r) => r.customerId ?? r.customer).filter(Boolean));

  let goodCount = 0;
  let warningCount = 0;
  let criticalCount = 0;
  for (const r of records) {
    const bucket = bucketOf(r.status);
    if (bucket === "good") goodCount += 1;
    else if (bucket === "critical") criticalCount += 1;
    else warningCount += 1;
  }

  const decided = goodCount + criticalCount;

  return {
    totalDeals,
    totalPremium,
    avgPremium: totalDeals ? totalPremium / totalDeals : 0,
    distinctCustomers: customers.size,
    goodCount,
    warningCount,
    criticalCount,
    winRate: decided ? goodCount / decided : 0,
  };
}

export interface MonthOverMonth {
  currentLabel: string;
  previousLabel: string;
  currentPremium: number;
  previousPremium: number;
  currentCount: number;
  previousCount: number;
  premiumDeltaPct: number | null;
  countDeltaPct: number | null;
}

export function monthOverMonth(records: SalesRecord[]): MonthOverMonth | null {
  const trend = monthlyTrend(records);
  if (trend.length < 1) return null;
  const current = trend[trend.length - 1];
  const previous = trend.length >= 2 ? trend[trend.length - 2] : null;

  const pct = (curr: number, prev: number): number | null => {
    if (!previous) return null;
    if (prev === 0) return curr === 0 ? 0 : null;
    return (curr - prev) / prev;
  };

  return {
    currentLabel: current.monthKey,
    previousLabel: previous?.monthKey ?? "",
    currentPremium: current.premium,
    previousPremium: previous?.premium ?? 0,
    currentCount: current.count,
    previousCount: previous?.count ?? 0,
    premiumDeltaPct: previous ? pct(current.premium, previous.premium) : null,
    countDeltaPct: previous ? pct(current.count, previous.count) : null,
  };
}

export interface MonthlyPace {
  monthLabel: string;
  previousMonthLabel: string | null;
  actualPremium: number;
  projectedPremium: number;
  previousSameDatePremium: number | null;
  growthPct: number | null;
  daysElapsed: number;
  daysInMonth: number;
  isProjecting: boolean;
}

function premiumThroughDay(records: SalesRecord[], monthKey: string, throughDay: number): number {
  let sum = 0;
  for (const r of records) {
    if (!r.requiredDate || monthKeyOf(r.requiredDate) !== monthKey) continue;
    const day = Number(r.requiredDate.slice(8, 10));
    if (day <= throughDay) sum += r.expectedPremium ?? 0;
  }
  return sum;
}

/**
 * Projects the latest month's premium to a full-month equivalent based on
 * its pace so far (actualPremium / daysElapsed * daysInMonth), and compares
 * that same-far-in premium against the equivalent date in the previous
 * month — an apples-to-apples read on whether this month is pacing ahead of
 * or behind the last one. For a month that has already fully passed,
 * daysElapsed equals daysInMonth so the projection simply equals the actual
 * total (and the comparison is the full previous month).
 */
export function monthlyPaceProjection(records: SalesRecord[], today: Date = new Date()): MonthlyPace | null {
  const trend = monthlyTrend(records);
  if (trend.length === 0) return null;
  const current = trend[trend.length - 1];
  const previous = trend.length >= 2 ? trend[trend.length - 2] : null;
  const [y, m] = current.monthKey.split("-").map(Number);
  const todayY = today.getFullYear();
  const todayM = today.getMonth() + 1;
  const daysInMonth = new Date(y, m, 0).getDate();

  if (y > todayY || (y === todayY && m > todayM)) return null;
  const daysElapsed = y === todayY && m === todayM ? today.getDate() : daysInMonth;

  // Only count days actually reached so far, in case the month's data includes future-dated entries.
  const actualPremium = premiumThroughDay(records, current.monthKey, daysElapsed);
  const rate = daysElapsed > 0 ? actualPremium / daysElapsed : 0;

  let previousSameDatePremium: number | null = null;
  let growthPct: number | null = null;
  if (previous) {
    const [py, pm] = previous.monthKey.split("-").map(Number);
    const daysInPreviousMonth = new Date(py, pm, 0).getDate();
    const cappedDay = Math.min(daysElapsed, daysInPreviousMonth);
    previousSameDatePremium = premiumThroughDay(records, previous.monthKey, cappedDay);
    growthPct =
      previousSameDatePremium === 0 ? (actualPremium === 0 ? 0 : null) : (actualPremium - previousSameDatePremium) / previousSameDatePremium;
  }

  return {
    monthLabel: current.monthKey,
    previousMonthLabel: previous?.monthKey ?? null,
    actualPremium,
    projectedPremium: rate * daysInMonth,
    previousSameDatePremium,
    growthPct,
    daysElapsed,
    daysInMonth,
    isProjecting: daysElapsed < daysInMonth,
  };
}

export interface ProcessTypeStatusBreakdownRow {
  key: string;
  total: number;
  totalPremium: number;
  counts: Record<string, number>;
  premiums: Record<string, number>;
}

/** For a fixed list of process types, breaks each down by its real (unbucketed) status values. */
export function statusBreakdownForProcessTypes(
  records: SalesRecord[],
  processTypes: string[],
): { rows: ProcessTypeStatusBreakdownRow[]; statuses: string[] } {
  const rowByType = new Map<string, ProcessTypeStatusBreakdownRow>();
  for (const pt of processTypes) rowByType.set(pt, { key: pt, total: 0, totalPremium: 0, counts: {}, premiums: {} });

  const statusTotals = new Map<string, number>();

  for (const r of records) {
    if (!r.processType || !rowByType.has(r.processType)) continue;
    const row = rowByType.get(r.processType)!;
    const status = r.status ?? "לא צוין";
    const premium = r.expectedPremium ?? 0;
    row.counts[status] = (row.counts[status] ?? 0) + 1;
    row.premiums[status] = (row.premiums[status] ?? 0) + premium;
    row.total += 1;
    row.totalPremium += premium;
    statusTotals.set(status, (statusTotals.get(status) ?? 0) + 1);
  }

  const statuses = Array.from(statusTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([status]) => status);

  return { rows: processTypes.map((pt) => rowByType.get(pt)!), statuses };
}

export function distinctSorted(records: SalesRecord[], field: "rep" | "status" | "processType" | "insurer" | "productType"): string[] {
  const set = new Set<string>();
  for (const r of records) {
    const v = r[field];
    if (v) set.add(v);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "he"));
}
