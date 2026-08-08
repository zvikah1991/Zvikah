import type { StatusBucket } from "../types";

// Semantic classification of the CRM's raw status strings into a small,
// fixed set of "health" buckets used for KPI tiles and pill colors.
const GOOD_STATUSES = new Set(["הופק", "הסתיים טיפול"]);
const CRITICAL_STATUSES = new Set(["מבוטל", "רג'קט לטיפול"]);

export function statusBucket(status: string | null): StatusBucket {
  if (!status) return "neutral";
  if (GOOD_STATUSES.has(status)) return "good";
  if (CRITICAL_STATUSES.has(status)) return "critical";
  return "warning";
}

export const STATUS_BUCKET_LABEL: Record<StatusBucket, string> = {
  good: "הופק / הושלם",
  warning: "בטיפול",
  critical: "בוטל / נדחה",
  neutral: "לא ידוע",
};

export const STATUS_BUCKET_COLOR_VAR: Record<StatusBucket, string> = {
  good: "var(--status-good)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
  neutral: "var(--text-muted)",
};
