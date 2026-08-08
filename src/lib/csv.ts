import type { SalesRecord } from "../types";

const COLUMNS: { key: keyof SalesRecord; label: string }[] = [
  { key: "id", label: "מספר תהליך" },
  { key: "processType", label: "סוג תהליך" },
  { key: "customer", label: "לקוח" },
  { key: "status", label: "סטטוס" },
  { key: "rep", label: "מטפל" },
  { key: "requiredDate", label: "תאריך טיפול נדרש" },
  { key: "expectedPremium", label: "פרמיה צפויה" },
  { key: "owner", label: "בעלים" },
  { key: "insurer", label: "יצרן חדש" },
  { key: "productType", label: "סוג מוצר חדש" },
];

function escapeCsvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportRecordsToCsv(records: SalesRecord[], filename: string): void {
  const header = COLUMNS.map((c) => c.label).join(",");
  const rows = records.map((r) => COLUMNS.map((c) => escapeCsvCell(r[c.key])).join(","));
  const csv = [header, ...rows].join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
