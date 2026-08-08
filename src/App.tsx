import { useMemo, useState } from "react";
import { EMPTY_FILTERS, type Filters } from "./types";
import { useSalesData } from "./hooks/useSalesData";
import { useTheme } from "./hooks/useTheme";
import { applyFilters, groupByField, sortByMetric, topNWithOther } from "./lib/aggregations";
import { buildColorScale } from "./lib/colorScale";
import { Header } from "./components/Header";
import { FilterBar } from "./components/FilterBar";
import { KpiCards } from "./components/KpiCards";
import { MonthlyTrendChart } from "./components/charts/MonthlyTrendChart";
import { RepBarChart } from "./components/charts/RepBarChart";
import { StatusDonutChart } from "./components/charts/StatusDonutChart";
import { RankedBarChart } from "./components/charts/RankedBarChart";
import { DataTable } from "./components/DataTable";
import { ErrorBanner } from "./components/ui/ErrorBanner";

export default function App() {
  const { records, meta, uploadFile, resetToSeed, isUploading, isUsingSeed, error, clearError } = useSalesData();
  const { theme, toggle } = useTheme();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const filtered = useMemo(() => applyFilters(records, filters), [records, filters]);
  const filteredIgnoringDate = useMemo(() => applyFilters(records, filters, { ignoreDate: true }), [records, filters]);

  const repColorScale = useMemo(() => buildColorScale(groupByField(records, "rep")), [records]);
  const statusColorScale = useMemo(
    () => buildColorScale(topNWithOther(sortByMetric(groupByField(records, "status"), "count"), 7)),
    [records],
  );
  const insurerColorScale = useMemo(() => buildColorScale(topNWithOther(groupByField(records, "insurer"), 6)), [records]);
  const productColorScale = useMemo(() => buildColorScale(topNWithOther(groupByField(records, "productType"), 6)), [records]);

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
          <MonthlyTrendChart records={filtered} />
          <RepBarChart records={filtered} colorScale={repColorScale} />
          <StatusDonutChart records={filtered} colorScale={statusColorScale} />
          <RankedBarChart title="מכירות לפי יצרן" records={filtered} field="insurer" colorScale={insurerColorScale} topN={6} />
          <RankedBarChart title="מכירות לפי סוג מוצר" records={filtered} field="productType" colorScale={productColorScale} topN={6} />
        </div>

        <DataTable records={filtered} />

        <footer className="py-4 text-center text-xs text-[var(--text-muted)]">
          הנתונים מוצגים לצרכי ניהול פנימי בלבד · מקור: דו״ח WorkflowsExport
        </footer>
      </main>
    </div>
  );
}
