import { useMemo, useState } from "react";
import { EMPTY_FILTERS, type Filters } from "./types";
import { useSalesData } from "./hooks/useSalesData";
import { useTheme } from "./hooks/useTheme";
import { applyFilters, groupByField } from "./lib/aggregations";
import { buildColorScale } from "./lib/colorScale";
import { Header } from "./components/Header";
import { FilterBar } from "./components/FilterBar";
import { KpiCards } from "./components/KpiCards";
import { MonthlyTrendChart } from "./components/charts/MonthlyTrendChart";
import { RepByMonthChart } from "./components/charts/RepByMonthChart";
import { ProcessTypeStatusChart } from "./components/charts/ProcessTypeStatusChart";
import { RankedBarChart } from "./components/charts/RankedBarChart";
import { RecentClosedList } from "./components/RecentClosedList";
import { CustomersTable } from "./components/CustomersTable";
import { DataTable } from "./components/DataTable";
import { ErrorBanner } from "./components/ui/ErrorBanner";

export default function App() {
  const { records, meta, uploadFile, resetToSeed, isUploading, isUsingSeed, error, clearError } = useSalesData();
  const { theme, toggle } = useTheme();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const filtered = useMemo(() => applyFilters(records, filters), [records, filters]);
  const filteredIgnoringDate = useMemo(() => applyFilters(records, filters, { ignoreDate: true }), [records, filters]);

  const repColorScale = useMemo(() => buildColorScale(groupByField(records, "rep")), [records]);
  const insurerColorScale = useMemo(() => buildColorScale(groupByField(records, "insurer")), [records]);

  return (
    <div className="min-h-screen">
      <Header
        meta={meta}
        isUsingSeed={isUsingSeed}
        isUploading={isUploading}
        onUpload={uploadFile}
        onReset={resetToSeed}
        theme={theme}
        onToggleTheme={toggle}
      />

      <main className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-5 sm:px-6">
        {error && <ErrorBanner message={error} onDismiss={clearError} />}

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
          <FilterBar allRecords={records} filters={filters} onChange={setFilters} />
        </div>

        <KpiCards filtered={filtered} filteredIgnoringDate={filteredIgnoringDate} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MonthlyTrendChart records={filteredIgnoringDate} />
          <RepByMonthChart records={filteredIgnoringDate} colorScale={repColorScale} />
          <RankedBarChart title="מכירות לפי חברות ביטוח" records={filtered} field="insurer" colorScale={insurerColorScale} topN={6} />
          <ProcessTypeStatusChart records={filtered} />
        </div>

        <RecentClosedList records={filtered} />
        <CustomersTable records={filtered} />
        <DataTable records={filtered} />

        <footer className="py-4 text-center text-xs text-[var(--text-muted)]">
          הנתונים מוצגים לצרכי ניהול פנימי בלבד · מקור: דו״ח WorkflowsExport
        </footer>
      </main>
    </div>
  );
}
