import { useMemo, useState } from "react";
import type { Filters, SalesRecord } from "../types";
import { EMPTY_FILTERS } from "../types";
import { distinctSorted } from "../lib/aggregations";
import { formatMonthKeyShort, monthKeyOf, monthRangeISO, yearOf, yearRangeISO } from "../lib/format";
import { MultiSelect } from "./ui/MultiSelect";
import clsx from "clsx";

type Mode = "all" | "month" | "year" | "custom";

export function FilterBar({
  allRecords,
  filters,
  onChange,
}: {
  allRecords: SalesRecord[];
  filters: Filters;
  onChange: (next: Filters) => void;
}) {
  const [customOpen, setCustomOpen] = useState(false);

  const reps = useMemo(() => distinctSorted(allRecords, "rep"), [allRecords]);
  const statuses = useMemo(() => distinctSorted(allRecords, "status"), [allRecords]);
  const processTypes = useMemo(() => distinctSorted(allRecords, "processType"), [allRecords]);
  const insurers = useMemo(() => distinctSorted(allRecords, "insurer"), [allRecords]);
  const productTypes = useMemo(() => distinctSorted(allRecords, "productType"), [allRecords]);

  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of allRecords) if (r.requiredDate) set.add(monthKeyOf(r.requiredDate));
    return Array.from(set).sort().reverse();
  }, [allRecords]);

  const yearOptions = useMemo(() => {
    const set = new Set<number>();
    for (const r of allRecords) if (r.requiredDate) set.add(yearOf(r.requiredDate));
    return Array.from(set).sort((a, b) => b - a);
  }, [allRecords]);

  const { mode, month: activeMonth, year: activeYear } = useMemo((): { mode: Mode; month?: string; year?: number } => {
    if (!filters.dateFrom && !filters.dateTo) return { mode: "all" };
    for (const m of monthOptions) {
      const r = monthRangeISO(m);
      if (filters.dateFrom === r.from && filters.dateTo === r.to) return { mode: "month", month: m };
    }
    for (const y of yearOptions) {
      const r = yearRangeISO(y);
      if (filters.dateFrom === r.from && filters.dateTo === r.to) return { mode: "year", year: y };
    }
    return { mode: "custom" };
  }, [filters.dateFrom, filters.dateTo, monthOptions, yearOptions]);

  const pillClass = (active: boolean) =>
    clsx(
      "rounded-lg border-0 bg-transparent px-2.5 py-1 text-sm outline-none transition-colors",
      active ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm font-medium" : "text-[var(--text-secondary)] hover:bg-[var(--surface)]/60",
    );

  const activeFilterCount =
    (filters.dateFrom || filters.dateTo ? 1 : 0) +
    filters.reps.length +
    filters.statuses.length +
    filters.processTypes.length +
    filters.insurers.length +
    filters.productTypes.length +
    (filters.search ? 1 : 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-1">
          <select
            value={mode === "month" ? activeMonth : ""}
            onChange={(e) => {
              const m = e.target.value;
              if (!m) return;
              const r = monthRangeISO(m);
              onChange({ ...filters, dateFrom: r.from, dateTo: r.to });
              setCustomOpen(false);
            }}
            className={pillClass(mode === "month")}
          >
            <option value="" disabled>
              חודש
            </option>
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {formatMonthKeyShort(m)}
              </option>
            ))}
          </select>

          <select
            value={mode === "year" ? String(activeYear) : ""}
            onChange={(e) => {
              const y = e.target.value;
              if (!y) return;
              const r = yearRangeISO(Number(y));
              onChange({ ...filters, dateFrom: r.from, dateTo: r.to });
              setCustomOpen(false);
            }}
            className={pillClass(mode === "year")}
          >
            <option value="" disabled>
              שנה
            </option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button type="button" onClick={() => setCustomOpen((o) => !o)} className={pillClass(mode === "custom")}>
            טווח מותאם
          </button>
        </div>

        {customOpen && (
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-1">
            <input
              type="date"
              value={filters.dateFrom ?? ""}
              onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || null })}
              className="rounded-md bg-transparent px-1 py-0.5 text-sm outline-none"
            />
            <span className="text-[var(--text-muted)]">—</span>
            <input
              type="date"
              value={filters.dateTo ?? ""}
              onChange={(e) => onChange({ ...filters, dateTo: e.target.value || null })}
              className="rounded-md bg-transparent px-1 py-0.5 text-sm outline-none"
            />
          </div>
        )}

        <div className="h-6 w-px bg-[var(--border)]" />

        <MultiSelect label="נציג" options={reps} selected={filters.reps} onChange={(v) => onChange({ ...filters, reps: v })} />
        <MultiSelect label="סטטוס" options={statuses} selected={filters.statuses} onChange={(v) => onChange({ ...filters, statuses: v })} />
        <MultiSelect
          label="סוג תהליך"
          options={processTypes}
          selected={filters.processTypes}
          onChange={(v) => onChange({ ...filters, processTypes: v })}
        />
        <MultiSelect label="יצרן" options={insurers} selected={filters.insurers} onChange={(v) => onChange({ ...filters, insurers: v })} />
        <MultiSelect
          label="סוג מוצר"
          options={productTypes}
          selected={filters.productTypes}
          onChange={(v) => onChange({ ...filters, productTypes: v })}
        />

        <div className="relative min-w-40 flex-1">
          <input
            type="text"
            placeholder="חיפוש לקוח / נציג / יצרן…"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--brand)]/50"
          />
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="rounded-lg px-2.5 py-1.5 text-sm text-[var(--series-8)] hover:bg-[var(--surface-2)]"
          >
            נקה הכל ({activeFilterCount})
          </button>
        )}
      </div>
    </div>
  );
}
