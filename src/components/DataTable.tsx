import { useMemo, useState } from "react";
import type { SalesRecord } from "../types";
import { formatCurrency, formatDate, formatNumber } from "../lib/format";
import { exportRecordsToCsv } from "../lib/csv";
import { Card } from "./ui/Card";
import { SectionTitle } from "./ui/SectionTitle";
import { StatusPill } from "./ui/StatusPill";
import { IconDownload } from "./ui/Icons";

type SortKey = "id" | "customer" | "processType" | "status" | "rep" | "requiredDate" | "expectedPremium" | "insurer" | "productType";

const COLUMNS: { key: SortKey; label: string; align?: "start" | "end" }[] = [
  { key: "id", label: "מס׳ תהליך", align: "end" },
  { key: "customer", label: "לקוח" },
  { key: "processType", label: "סוג תהליך" },
  { key: "status", label: "סטטוס" },
  { key: "rep", label: "נציג" },
  { key: "requiredDate", label: "תאריך טיפול", align: "end" },
  { key: "expectedPremium", label: "פרמיה צפויה", align: "end" },
  { key: "insurer", label: "יצרן" },
  { key: "productType", label: "סוג מוצר" },
];

const PAGE_SIZE = 20;

export function DataTable({ records, delayMs }: { records: SalesRecord[]; delayMs?: number }) {
  const [sortKey, setSortKey] = useState<SortKey>("requiredDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const copy = records.slice();
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
  }, [records, sortKey, sortDir]);

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
    <Card className="animate-fade-up overflow-hidden" style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}>
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] p-4">
        <div>
          <SectionTitle>כל העסקאות ({formatNumber(records.length)})</SectionTitle>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">כל תהליך בנפרד · לחיצה על כותרת עמודה ממיינת את הטבלה</p>
        </div>
        <button
          type="button"
          onClick={() => exportRecordsToCsv(sorted, `sales-export-${new Date().toISOString().slice(0, 10)}.csv`)}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
        >
          <IconDownload className="h-4 w-4" />
          ייצוא ל-CSV
        </button>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[720px] text-sm">
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
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-s-2 border-s-transparent border-[var(--border)] transition-colors last:border-b-0 hover:border-s-[var(--brand)] hover:bg-[var(--surface-2)]/60"
              >
                <td className="whitespace-nowrap px-3 py-2 text-end tabular-nums text-[var(--text-muted)]">{r.id}</td>
                <td className="max-w-40 truncate px-3 py-2">{r.customer ?? "—"}</td>
                <td className="max-w-36 truncate px-3 py-2 text-[var(--text-secondary)]">{r.processType ?? "—"}</td>
                <td className="px-3 py-2">
                  <StatusPill status={r.status} />
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-[var(--text-secondary)]">{r.rep ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-end tabular-nums">{formatDate(r.requiredDate)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-end font-medium tabular-nums">
                  {r.expectedPremium !== null ? formatCurrency(r.expectedPremium) : "—"}
                </td>
                <td className="max-w-32 truncate px-3 py-2 text-[var(--text-secondary)]">{r.insurer ?? "—"}</td>
                <td className="max-w-32 truncate px-3 py-2 text-[var(--text-secondary)]">{r.productType ?? "—"}</td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-8 text-center text-[var(--text-muted)]">
                  אין רשומות תואמות לסינון הנוכחי
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
