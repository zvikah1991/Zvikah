import { useMemo, useState } from "react";
import type { SalesRecord } from "../types";
import { summarizeCustomers, type CustomerSummary } from "../lib/customers";
import { statusBucket } from "../lib/statusBuckets";
import { formatCurrency, formatDate, formatNumber } from "../lib/format";
import { exportCustomersToCsv } from "../lib/csv";
import { Card } from "./ui/Card";
import { StatusPill } from "./ui/StatusPill";
import { IconDownload } from "./ui/Icons";

type SortKey = "customer" | "dealCount" | "totalPremium" | "lastDate";

const COLUMNS: { key: SortKey; label: string; align?: "start" | "end" }[] = [
  { key: "customer", label: "לקוח" },
  { key: "dealCount", label: "מס' עסקאות", align: "end" },
  { key: "totalPremium", label: "סה\"כ פרמיה", align: "end" },
  { key: "lastDate", label: "תאריך אחרון", align: "end" },
];

const PAGE_SIZE = 15;

export function CustomersTable({ records }: { records: SalesRecord[] }) {
  const customers = useMemo(() => summarizeCustomers(records, statusBucket), [records]);
  const [sortKey, setSortKey] = useState<SortKey>("lastDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const copy = customers.slice();
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
      const cmp = String(av).localeCompare(String(bv), "he");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [customers, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  };

  return (
    <Card className="animate-fade-up overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] p-4">
        <div>
          <h3 className="text-sm font-semibold">כל הלקוחות ({formatNumber(customers.length)})</h3>
          <p className="text-xs text-[var(--text-muted)]">מרוכז לפי לקוח — כולל כל העסקאות שלו</p>
        </div>
        <button
          type="button"
          onClick={() => exportCustomersToCsv(sorted, `customers-export-${new Date().toISOString().slice(0, 10)}.csv`)}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
        >
          <IconDownload className="h-4 w-4" />
          ייצוא ל-CSV
        </button>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={`cursor-pointer select-none whitespace-nowrap px-3 py-2 font-medium hover:text-[var(--text-primary)] ${
                    col.align === "end" ? "text-end" : "text-start"
                  }`}
                >
                  {col.label}
                  {sortKey === col.key && <span className="ms-1">{sortDir === "asc" ? "▲" : "▼"}</span>}
                </th>
              ))}
              <th className="whitespace-nowrap px-3 py-2 text-start font-medium">נציג</th>
              <th className="whitespace-nowrap px-3 py-2 text-start font-medium">חברת ביטוח</th>
              <th className="whitespace-nowrap px-3 py-2 text-start font-medium">סטטוס אחרון</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((c) => (
              <CustomerRow key={c.key} customer={c} />
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-[var(--text-muted)]">
                  אין לקוחות תואמים לסינון הנוכחי
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-2 p-3 text-sm">
        <span className="text-[var(--text-muted)]">
          עמוד {formatNumber(clampedPage + 1)} מתוך {formatNumber(pageCount)}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={clampedPage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-lg border border-[var(--border)] px-3 py-1 disabled:opacity-40"
          >
            הקודם
          </button>
          <button
            type="button"
            disabled={clampedPage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="rounded-lg border border-[var(--border)] px-3 py-1 disabled:opacity-40"
          >
            הבא
          </button>
        </div>
      </div>
    </Card>
  );
}

function CustomerRow({ customer }: { customer: CustomerSummary }) {
  return (
    <tr className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]/60">
      <td className="max-w-44 truncate px-3 py-2 font-medium">{customer.customer}</td>
      <td className="whitespace-nowrap px-3 py-2 text-end tabular-nums">{formatNumber(customer.dealCount)}</td>
      <td className="whitespace-nowrap px-3 py-2 text-end font-medium tabular-nums">{formatCurrency(customer.totalPremium)}</td>
      <td className="whitespace-nowrap px-3 py-2 text-end tabular-nums">{formatDate(customer.lastDate)}</td>
      <td className="max-w-32 truncate px-3 py-2 text-[var(--text-secondary)]">{customer.reps.join(", ") || "—"}</td>
      <td className="max-w-32 truncate px-3 py-2 text-[var(--text-secondary)]">{customer.insurers.join(", ") || "—"}</td>
      <td className="px-3 py-2">
        <StatusPill status={customer.lastStatus} />
      </td>
    </tr>
  );
}
