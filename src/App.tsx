import { useMemo, useState } from "react";
import { EMPTY_FILTERS, type Filters } from "./types";
import { useSalesData } from "./hooks/useSalesData";
import { useTheme } from "./hooks/useTheme";
import { applyFilters, groupByField } from "./lib/aggregations";
import { buildColorScale } from "./lib/colorScale";
import { currentMonthKey, monthRangeISO } from "./lib/format";
import { AGENT_APPOINTMENT_PROCESS_TYPES, CORE_PROCESS_TYPES } from "./config";
import { Header } from "./components/Header";
import { SectionNav } from "./components/SectionNav";
import { FilterBar } from "./components/FilterBar";
import { KpiCards } from "./components/KpiCards";
import { InsightBanner } from "./components/InsightBanner";
import { AgentAppointmentBanner } from "./components/AgentAppointmentBanner";
import { MonthlyTrendChart } from "./components/charts/MonthlyTrendChart";
import { RepByMonthChart } from "./components/charts/RepByMonthChart";
import { ProcessTypeStatusChart } from "./components/charts/ProcessTypeStatusChart";
import { RankedBarChart } from "./components/charts/RankedBarChart";
import { RepLeaderboard } from "./components/RepLeaderboard";
import { RecentClosedList } from "./components/RecentClosedList";
import { CustomersTable } from "./components/CustomersTable";
import { DataTable } from "./components/DataTable";
import { ErrorBanner } from "./components/ui/ErrorBanner";
import { Reveal } from "./components/ui/Reveal";

export default function App() {
  const { records, meta, uploadFile, resetToSeed, isUploading, isUsingSeed, error, clearError } = useSalesData();
  const { theme, toggle } = useTheme();
  const [filters, setFilters] = useState<Filters>(() => {
    const { from, to } = monthRangeISO(currentMonthKey());
    return { ...EMPTY_FILTERS, dateFrom: from, dateTo: to };
  });

  // The report covers real sales only (שיחלוף מוצר / רכישת מוצר חדש); agent
  // appointments and other administrative process types are excluded from
  // every figure below and shown as their own separate line instead.
  const coreRecords = useMemo(() => records.filter((r) => r.processType && CORE_PROCESS_TYPES.includes(r.processType)), [records]);
  const agentAppointmentRecords = useMemo(
    () => records.filter((r) => r.processType && AGENT_APPOINTMENT_PROCESS_TYPES.includes(r.processType)),
    [records],
  );

  const filtered = useMemo(() => applyFilters(coreRecords, filters), [coreRecords, filters]);
  const filteredIgnoringDate = useMemo(() => applyFilters(coreRecords, filters, { ignoreDate: true }), [coreRecords, filters]);
  const agentAppointmentFiltered = useMemo(
    () => applyFilters(agentAppointmentRecords, { ...filters, processTypes: [] }),
    [agentAppointmentRecords, filters],
  );

  const repColorScale = useMemo(() => buildColorScale(groupByField(coreRecords, "rep")), [coreRecords]);
  const insurerColorScale = useMemo(() => buildColorScale(groupByField(coreRecords, "insurer")), [coreRecords]);

  return (
    <div className="relative min-h-screen isolate">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1100px 620px at 6% -10%, color-mix(in oklab, var(--series-1) 16%, transparent), transparent 60%)," +
            "radial-gradient(900px 560px at 94% -8%, color-mix(in oklab, var(--brand-gold) 20%, transparent), transparent 60%)," +
            "radial-gradient(1000px 620px at 12% 55%, color-mix(in oklab, var(--series-3) 12%, transparent), transparent 65%)," +
            "radial-gradient(1000px 620px at 96% 68%, color-mix(in oklab, var(--series-7) 12%, transparent), transparent 65%)," +
            "radial-gradient(900px 560px at 50% 100%, color-mix(in oklab, var(--series-2) 10%, transparent), transparent 65%)",
        }}
      />

      <Header
        meta={meta}
        isUsingSeed={isUsingSeed}
        isUploading={isUploading}
        onUpload={uploadFile}
        onReset={resetToSeed}
        theme={theme}
        onToggleTheme={toggle}
      />
      <SectionNav />

      <main className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-5 sm:px-6">
        {error && <ErrorBanner message={error} onDismiss={clearError} />}

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
          <FilterBar allRecords={coreRecords} filters={filters} onChange={setFilters} />
        </div>

        <div id="overview" className="flex flex-col gap-4" style={{ scrollMarginTop: "112px" }}>
          <InsightBanner records={filteredIgnoringDate} delayMs={0} />
          <KpiCards filtered={filtered} filteredIgnoringDate={filteredIgnoringDate} />
          <AgentAppointmentBanner records={agentAppointmentFiltered} delayMs={380} />
        </div>

        <Reveal id="trends" className="grid grid-cols-1 gap-4 lg:grid-cols-2" style={{ scrollMarginTop: "112px" }}>
          <MonthlyTrendChart records={filteredIgnoringDate} delayMs={0} />
          <RepByMonthChart records={filteredIgnoringDate} colorScale={repColorScale} delayMs={80} />
          <RankedBarChart title="מכירות לפי חברות ביטוח" records={filtered} field="insurer" colorScale={insurerColorScale} topN={6} delayMs={160} />
          <ProcessTypeStatusChart records={filtered} delayMs={240} />
        </Reveal>

        <Reveal id="leaderboard" style={{ scrollMarginTop: "112px" }}>
          <RepLeaderboard records={filteredIgnoringDate} delayMs={0} />
        </Reveal>

        <Reveal id="activity" style={{ scrollMarginTop: "112px" }}>
          <RecentClosedList records={filtered} delayMs={0} />
        </Reveal>
        <Reveal id="customers" style={{ scrollMarginTop: "112px" }}>
          <CustomersTable records={filtered} delayMs={0} />
        </Reveal>
        <Reveal id="deals" style={{ scrollMarginTop: "112px" }}>
          <DataTable records={filtered} delayMs={0} />
        </Reveal>

        <footer className="py-4 text-center text-xs text-[var(--text-muted)]">
          הנתונים מוצגים לצרכי ניהול פנימי בלבד · מקור: דו״ח WorkflowsExport
        </footer>
      </main>
    </div>
  );
}
