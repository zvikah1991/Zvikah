import type { SalesRecord, StatusBucket } from "../types";

export interface CustomerSummary {
  key: string;
  customer: string;
  customerId: number | null;
  dealCount: number;
  totalPremium: number;
  reps: string[];
  insurers: string[];
  lastDate: string | null;
  lastStatus: string | null;
  goodCount: number;
  warningCount: number;
  criticalCount: number;
}

/** Rolls up per-transaction records into one row per customer. */
export function summarizeCustomers(records: SalesRecord[], bucketOf: (status: string | null) => StatusBucket): CustomerSummary[] {
  const map = new Map<string, CustomerSummary>();

  for (const r of records) {
    const key = r.customerId !== null ? `id:${r.customerId}` : `name:${r.customer ?? `unknown-${r.id}`}`;
    const bucket = bucketOf(r.status);
    const premium = r.expectedPremium ?? 0;

    let summary = map.get(key);
    if (!summary) {
      summary = {
        key,
        customer: r.customer ?? "לא ידוע",
        customerId: r.customerId,
        dealCount: 0,
        totalPremium: 0,
        reps: [],
        insurers: [],
        lastDate: null,
        lastStatus: null,
        goodCount: 0,
        warningCount: 0,
        criticalCount: 0,
      };
      map.set(key, summary);
    }

    summary.dealCount += 1;
    summary.totalPremium += premium;
    if (r.rep && !summary.reps.includes(r.rep)) summary.reps.push(r.rep);
    if (r.insurer && !summary.insurers.includes(r.insurer)) summary.insurers.push(r.insurer);
    if (bucket === "good") summary.goodCount += 1;
    else if (bucket === "critical") summary.criticalCount += 1;
    else summary.warningCount += 1;

    if (r.requiredDate && (!summary.lastDate || r.requiredDate > summary.lastDate)) {
      summary.lastDate = r.requiredDate;
      summary.lastStatus = r.status;
    }
  }

  return Array.from(map.values()).sort((a, b) => (b.lastDate ?? "").localeCompare(a.lastDate ?? ""));
}

/** The most recently closed (good-bucket) deals, newest first. */
export function recentClosedDeals(records: SalesRecord[], bucketOf: (status: string | null) => StatusBucket, limit = 10): SalesRecord[] {
  return records
    .filter((r) => r.requiredDate && bucketOf(r.status) === "good")
    .sort((a, b) => (b.requiredDate ?? "").localeCompare(a.requiredDate ?? ""))
    .slice(0, limit);
}

/** Still-in-progress (warning-bucket) deals whose required-treatment date has already passed — the follow-up worklist. Most overdue first. */
export function overdueDeals(
  records: SalesRecord[],
  bucketOf: (status: string | null) => StatusBucket,
  todayISO: string,
  limit = 10,
): SalesRecord[] {
  return records
    .filter((r) => r.requiredDate && r.requiredDate < todayISO && bucketOf(r.status) === "warning")
    .sort((a, b) => (a.requiredDate ?? "").localeCompare(b.requiredDate ?? ""))
    .slice(0, limit);
}
