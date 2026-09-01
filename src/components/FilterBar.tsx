import { useEffect, useMemo, useRef, useState } from "react";
import type { Filters, SalesRecord } from "../types";
import { EMPTY_FILTERS } from "../types";
import { distinctSorted } from "../lib/aggregations";
import { formatMonthKeyShort, monthKeyOf, monthRangeISO, yearOf, yearRangeISO } from "../lib/format";
import { IconFilter, IconSearch, IconX } from "./ui/Icons";
import clsx from "clsx";

type Mode = "all" | "month" | "year" | "custom";

interface FilterGroup {
  key: keyof Pick<Filters, "reps" | "statuses" | "processTypes" | "insurers" | "productTypes">;
  label: string;
  options: string[];
}

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
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!panelOpen) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setPanelOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [panelOpen]);

  const groups: FilterGroup[] = useMemo(
    () => [
      { key: "reps", label: "נציג", options: distinctSorted(allRecords, "rep") },
      { key: "statuses", label: "סטטוס", options: distinctSorted(allRecords, "status") },
      { key: "processTypes", label: "סוג תהליך", options: distinctSorted(allRecords, "processType") },
      { key: "insurers", label: "יצרן", options: distinctSorted(allRecords, "insurer") },
      { key: "productTypes", label: "סוג מוצר", options: distinctSorted(allRecords, "productType") },
    ],
    [allRecords],
  );

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
      "h-8 rounded-lg border-0 bg-transparent px-2.5 text-sm outline-none transition-colors",
      active ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm font-semibold" : "text-[var(--text-secondary)] hover:bg-[var(--surface)]/60",
    );

  const groupFilterCount = groups.reduce((sum, g) => sum + filters[g.key].length, 0);
  const activeFilterCount = groupFilterCount + (filters.search ? 1 : 0);

  const toggleValue = (key: FilterGroup["key"], value: string) => {
    const current = filters[key];
    onChange({ ...filters, [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] });
  };

  const removeValue = (key: FilterGroup["key"], value: string) => {
    onChange({ ...filters, [key]: filters[key].filter((v) => v !== value) });
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex h-9 flex-wrap items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-1">
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
          <div className="flex h-9 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3">
            <input
              type="date"
              value={filters.dateFrom ?? ""}
              onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || null })}
              className="bg-transparent text-sm outline-none"
            />
            <span className="text-[var(--text-muted)]">—</span>
            <input
              type="date"
              value={filters.dateTo ?? ""}
              onChange={(e) => onChange({ ...filters, dateTo: e.target.value || null })}
              className="bg-transparent text-sm outline-none"
            />
          </div>
        )}

        <div className="relative h-9 min-w-40 flex-1 sm:max-w-64">
          <IconSearch className="pointer-events-none absolute top-1/2 start-3 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="חיפוש לקוח / נציג / יצרן…"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] ps-9 pe-3 text-sm outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]/50"
          />
        </div>

        <div className="relative" ref={panelRef}>
          <button
            type="button"
            onClick={() => setPanelOpen((o) => !o)}
            className={clsx(
              "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors",
              groupFilterCount > 0
                ? "border-[var(--brand)]/40 bg-[color-mix(in_oklab,var(--brand)_5%,var(--surface))] text-[var(--text-primary)] hover:bg-[color-mix(in_oklab,var(--brand)_9%,var(--surface))]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]",
            )}
          >
            <IconFilter className="h-3.5 w-3.5" />
            מסננים
            {groupFilterCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--brand)] px-1 text-xs font-semibold text-white tabular-nums">
                {groupFilterCount}
              </span>
            )}
          </button>

          {panelOpen && (
            <div
              className="animate-fade-up absolute z-20 mt-1.5 flex w-[min(90vw,26rem)] flex-col gap-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 end-0 sm:end-auto sm:start-0"
              style={{ boxShadow: "var(--shadow-xl)", animationDuration: "0.15s" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--text-primary)]">סינון מפורט</span>
                {groupFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, reps: [], statuses: [], processTypes: [], insurers: [], productTypes: [] })}
                    className="text-xs font-medium text-[var(--status-critical)] hover:underline"
                  >
                    ניקוי מסננים
                  </button>
                )}
              </div>

              <div className="flex max-h-[min(60vh,26rem)] flex-col gap-3.5 overflow-y-auto scrollbar-thin">
                {groups.map((g) => (
                  <div key={g.key}>
                    <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-[var(--text-muted)]">
                      <span>{g.label}</span>
                      {filters[g.key].length > 0 && <span className="tabular-nums">{filters[g.key].length} נבחרו</span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {g.options.length === 0 && <span className="text-xs text-[var(--text-muted)]">אין אפשרויות</span>}
                      {g.options.map((opt) => {
                        const checked = filters[g.key].includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => toggleValue(g.key, opt)}
                            className={clsx(
                              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                              checked
                                ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                                : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)]",
                            )}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="flex h-9 items-center gap-1 rounded-lg px-2.5 text-sm font-medium text-[var(--status-critical)] transition-colors hover:bg-[color-mix(in_oklab,var(--status-critical)_8%,transparent)]"
          >
            נקה הכל ({activeFilterCount})
          </button>
        )}
      </div>

      {groupFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {groups.map((g) =>
            filters[g.key].map((value) => (
              <span
                key={`${g.key}-${value}`}
                className="flex items-center gap-1 rounded-full bg-[var(--surface-2)] py-1 ps-2.5 pe-1.5 text-xs text-[var(--text-secondary)]"
              >
                <span className="text-[var(--text-muted)]">{g.label}:</span>
                <span className="font-medium text-[var(--text-primary)]">{value}</span>
                <button
                  type="button"
                  onClick={() => removeValue(g.key, value)}
                  className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]"
                  aria-label={`הסרת סינון ${value}`}
                >
                  <IconX className="h-2.5 w-2.5" />
                </button>
              </span>
            )),
          )}
        </div>
      )}
    </div>
  );
}
