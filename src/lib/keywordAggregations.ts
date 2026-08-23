import type { KeywordPerfRecord } from "../types";

export interface KeywordRow extends KeywordPerfRecord {
  costPerCall: number | null;
  status: "under" | "over" | "no-calls";
}

/** Ranks keywords by spend and flags each against the target cost-per-call — the direct answer to "which keywords to cut/scale to hit the target". */
export function rankKeywords(records: KeywordPerfRecord[], targetCostPerCall: number): KeywordRow[] {
  return records
    .map((r) => {
      const costPerCall = r.calls > 0 ? r.cost / r.calls : null;
      const status: KeywordRow["status"] = costPerCall === null ? "no-calls" : costPerCall <= targetCostPerCall ? "under" : "over";
      return { ...r, costPerCall, status };
    })
    .sort((a, b) => b.cost - a.cost);
}

export interface KeywordTotals {
  totalCost: number;
  totalCalls: number;
  blendedCostPerCall: number | null;
  wastedSpend: number; // cost sitting in keywords with zero calls — the clearest cut candidates
}

export function keywordTotals(records: KeywordPerfRecord[]): KeywordTotals {
  const totalCost = records.reduce((s, r) => s + r.cost, 0);
  const totalCalls = records.reduce((s, r) => s + r.calls, 0);
  const wastedSpend = records.filter((r) => r.calls === 0).reduce((s, r) => s + r.cost, 0);
  return { totalCost, totalCalls, blendedCostPerCall: totalCalls > 0 ? totalCost / totalCalls : null, wastedSpend };
}
