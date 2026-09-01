import { useMemo, useState } from "react";
import { EMPTY_FILTERS, type Filters } from "./types";
import { useSalesData } from "./hooks/useSalesData";
import { useTheme } from "./hooks/useTheme";
import { applyFilters, groupByField } from "./lib/aggregations";
import { buildColorScale } from "./lib/colorScale";
import { currentMonthKey, monthRangeISO } from "./lib/format";
import { AGENT_APPOINTMENT_PROCESS_TYPES, CORE_PROCESS_TYPES } from "./config";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { FilterBar } from "./components/FilterBar";
import { KpiCards } from "./components/KpiCards";
import { InsightBanner } from "./components/InsightBanner";
import { AgentAppointmentBanner } from "./components/AgentAppointmentBanner";
import { MonthlyTrendChart } from "./components/charts/MonthlyTrendChart";
import { RepByMonthChart } from "./components/charts/RepByMonthChart";
import { ProcessTypeStatusChart } from "./components/charts/ProcessTypeStatusChart";
import { RankedBarChart } from "./components/charts/RankedBarChart";
import { RepLeaderboard } from "./components/RepLeaderboard";
import { CommissionTable } from "./components/CommissionTable";
import { RecentClosedList } from "./components/RecentClosedList";
import { OverdueDealsList } from "./components/OverdueDealsList";
import { CustomersTable } from "./components/CustomersTable";
import { DataTable } from "./components/DataTable";
import { ErrorBanner } from "./components/ui/ErrorBanner";
import { Reveal } from "./components/ui/Reveal";
import { SectionHeading } from "./components/ui/SectionHeading";

const SCROLL_MARGIN = "scroll-mt-32 lg:scroll-mt-20";

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
    <div className="min-h-screen bg-[var(--page)] lg:flex">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          meta={meta}
          isUsingSeed={isUsingSeed}
          isUploading={isUploading}
          onUpload={uploadFile}
          onReset={resetToSeed}
          theme={theme}
          onToggleTheme={toggle}
        />

        <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
          {error && <ErrorBanner message={error} onDismiss={clearError} />}

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2.5" style={{ boxShadow: "var(--shadow-sm)" }}>
            <FilterBar allRecords={coreRecords} filters={filters} onChange={setFilters} />
          </div>

          <div id="overview" className={`flex flex-col gap-3 ${SCROLL_MARGIN}`}>
            <SectionHeading title="סקירה כללית" />
            <InsightBanner records={filteredIgnoringDate} delayMs={0} />
            <KpiCards filtered={filtered} filteredIgnoringDate={filteredIgnoringDate} />
            <AgentAppointmentBanner records={agentAppointmentFiltered} delayMs={0} />
          </div>

          <Reveal id="trends" className={`flex flex-col gap-3 ${SCROLL_MARGIN}`}>
            <SectionHeading title="מגמות ופילוחים" />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <MonthlyTrendChart records={filteredIgnoringDate} delayMs={0} />
              <RepByMonthChart records={filteredIgnoringDate} colorScale={repColorScale} delayMs={80} />
              <RankedBarChart title="מכירות לפי חברות ביטוח" records={filtered} field="insurer" colorScale={insurerColorScale} topN={6} delayMs={160} />
              <ProcessTypeStatusChart records={filtered} delayMs={240} />
            </div>
          </Reveal>

          <Reveal id="leaderboard" className={`flex flex-col gap-3 ${SCROLL_MARGIN}`}>
            <SectionHeading title="לוח מובילים" />
            <RepLeaderboard records={filteredIgnoringDate} delayMs={0} />
          </Reveal>

          <Reveal id="commissions" className={`flex flex-col gap-3 ${SCROLL_MARGIN}`}>
            <SectionHeading title="עמלות" />
            <CommissionTable coreRecords={coreRecords} agentAppointmentRecords={agentAppointmentRecords} delayMs={0} />
          </Reveal>

          <Reveal id="activity" className={`flex flex-col gap-3 ${SCROLL_MARGIN}`}>
            <SectionHeading title="פעילות אחרונה" />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <OverdueDealsList records={filtered} delayMs={0} />
              <RecentClosedList records={filtered} delayMs={60} />
            </div>
          </Reveal>
          <Reveal id="customers" className={`flex flex-col gap-3 ${SCROLL_MARGIN}`}>
            <SectionHeading title="לקוחות" />
            <CustomersTable records={filtered} delayMs={0} />
          </Reveal>
          <Reveal id="deals" className={`flex flex-col gap-3 ${SCROLL_MARGIN}`}>
            <SectionHeading title="כל העסקאות" />
            <DataTable records={filtered} delayMs={0} />
          </Reveal>

          <footer className="py-4 text-center text-xs text-[var(--text-muted)]">
            הנתונים מוצגים לצרכי ניהול פנימי בלבד · מקור: דו״ח WorkflowsExport
          </footer>
        </main>
      </div>
    </div>
  );
}
