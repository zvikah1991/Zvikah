import { useMemo, useState } from "react";
import type { Filters, SalesRecord } from "../types";
import { EMPTY_FILTERS } from "../types";
import { distinctSorted } from "../lib/aggregations";
import { isoDaysAgo, startOfMonthISO, startOfYearISO, todayISO } from "../lib/format";
import { MultiSelect } from "./ui/MultiSelect";
import clsx from "clsx";

type Preset = "all" | "month" | "last30" | "last90" | "quarter" | "year" | "custom";

function detectPreset(filters: Filters): Preset {
  if (!filters.dateFrom && !filters.dateTo) return "all";
  const today = todayISO();
  if (filters.dateTo === today) {
    if (filters.dateFrom === startOfMonthISO()) return "month";
    if (filters.dateFrom === isoDaysAgo(30)) return "last30";
    if (filters.dateFrom === isoDaysAgo(90)) return "last90";
    if (filters.dateFrom === startOfMonthISO(-2)) return "quarter";
    if (filters.dateFrom === startOfYearISO()) return "year";
  }
  return "custom";
}

const PRESETS: { id: Preset; label: string }[] = [
  { id: "all", label: "כל הזמנים" },
  { id: "month", label: "החודש" },
  { id: "last30", label: "30 יום אחרונים" },
  { id: "last90", label: "90 יום אחרונים" },
  { id: "quarter", label: "רבעון אחרון" },
  { id: "year", label: "השנה" },
];

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

  const activePreset = detectPreset(filters);

  const applyPreset = (preset: Preset) => {
    switch (preset) {
      case "all":
        onChange({ ...filters, dateFrom: null, dateTo: null });
        break;
      case "month":
        onChange({ ...filters, dateFrom: startOfMonthISO(), dateTo: todayISO() });
        break;
      case "last30":
        onChange({ ...filters, dateFrom: isoDaysAgo(30), dateTo: todayISO() });
        break;
      case "last90":
        onChange({ ...filters, dateFrom: isoDaysAgo(90), dateTo: todayISO() });
        break;
      case "quarter":
        onChange({ ...filters, dateFrom: startOfMonthISO(-2), dateTo: todayISO() });
        break;
      case "year":
        onChange({ ...filters, dateFrom: startOfYearISO(), dateTo: todayISO() });
        break;
    }
    setCustomOpen(false);
  };

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
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={clsx(
                "rounded-lg px-2.5 py-1 text-sm transition-colors",
                activePreset === p.id
                  ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm font-medium"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface)]/60",
              )}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCustomOpen((o) => !o)}
            className={clsx(
              "rounded-lg px-2.5 py-1 text-sm transition-colors",
              activePreset === "custom"
                ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm font-medium"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface)]/60",
            )}
          >
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
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--series-1)]/50"
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
