export interface SalesRecord {
  id: number;
  processType: string | null;
  customer: string | null;
  status: string | null;
  rep: string | null;
  requiredDate: string | null; // ISO yyyy-mm-dd
  expectedPremium: number | null;
  owner: string | null;
  customerId: number | null;
  insurer: string | null;
  productType: string | null;
}

export interface DataMeta {
  updatedAt: string; // ISO datetime of the upload/ingest
  fileName?: string;
  recordCount: number;
}

export interface Filters {
  dateFrom: string | null;
  dateTo: string | null;
  reps: string[];
  statuses: string[];
  processTypes: string[];
  insurers: string[];
  productTypes: string[];
  search: string;
}

export const EMPTY_FILTERS: Filters = {
  dateFrom: null,
  dateTo: null,
  reps: [],
  statuses: [],
  processTypes: [],
  insurers: [],
  productTypes: [],
  search: "",
};

export type StatusBucket = "good" | "warning" | "critical" | "neutral";

// -- Google Ads call-campaign tracker (self-managed, replaces the paid marketer's reporting) --

export interface AdsDayRecord {
  date: string; // ISO yyyy-mm-dd
  cost: number;
  clicks: number | null;
  impressions: number | null;
  calls: number; // call conversions (the thing actually worth paying for)
}

export interface AdsMeta {
  updatedAt: string; // ISO datetime of the upload/paste
  fileName?: string;
  recordCount: number;
}

export interface KeywordPerfRecord {
  keyword: string;
  matchType: string | null;
  cost: number;
  clicks: number | null;
  impressions: number | null;
  calls: number;
}
