import type { SalesRecord } from "../types";
import type { CustomerSummary } from "./customers";
import { formatDate } from "./format";

const RECORD_COLUMNS: { key: keyof SalesRecord; label: string }[] = [
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

function downloadCsv(header: string[], rows: string[][], filename: string): void {
  const csv = [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
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

export function exportRecordsToCsv(records: SalesRecord[], filename: string): void {
  const header = RECORD_COLUMNS.map((c) => c.label);
  const rows = records.map((r) => RECORD_COLUMNS.map((c) => String(r[c.key] ?? "")));
  downloadCsv(header, rows, filename);
}

export function exportCustomersToCsv(customers: CustomerSummary[], filename: string): void {
  const header = ["לקוח", "מזהה לקוח", "מס' עסקאות", "סה\"כ פרמיה", "נציגים", "חברות ביטוח", "סטטוס אחרון", "תאריך אחרון"];
  const rows = customers.map((c) => [
    c.customer,
    c.customerId !== null ? String(c.customerId) : "",
    String(c.dealCount),
    String(c.totalPremium),
    c.reps.join("; "),
    c.insurers.join("; "),
    c.lastStatus ?? "",
    formatDate(c.lastDate),
  ]);
  downloadCsv(header, rows, filename);
}
