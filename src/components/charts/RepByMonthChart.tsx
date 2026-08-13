import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SalesRecord } from "../../types";
import { groupByField } from "../../lib/aggregations";
import { colorFor } from "../../lib/colorScale";
import { formatCurrency, formatMonthKeyShort, formatNumber, monthKeyOf } from "../../lib/format";
import { workDaysElapsedInMonth, workDaysInMonth } from "../../lib/workdays";
import { ChartCard } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";
import clsx from "clsx";

type Metric = "premium" | "count" | "pace";

function RepMetricToggle({ metric, onChange }: { metric: Metric; onChange: (m: Metric) => void }) {
  const options: { id: Metric; label: string }[] = [
    { id: "premium", label: "פרמיה" },
    { id: "count", label: "כמות" },
    { id: "pace", label: "קצב חודשי" },
  ];
  return (
    <div className="flex rounded-lg border border-[var(--border)] p-0.5 text-xs">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={clsx("rounded-md px-2 py-1", metric === o.id ? "bg-[var(--surface-2)] font-medium" : "text-[var(--text-muted)]")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function RepByMonthChart({
  records,
  colorScale,
  delayMs,
}: {
  records: SalesRecord[];
  colorScale: Map<string, string>;
  delayMs?: number;
}) {
  const [metric, setMetric] = useState<Metric>("premium");

  const months = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) if (r.requiredDate) set.add(monthKeyOf(r.requiredDate));
    return Array.from(set).sort();
  }, [records]);

  const [month, setMonth] = useState<string>("");
  const selectedMonth = months.includes(month) ? month : (months[months.length - 1] ?? "");

  const monthRecords = useMemo(() => records.filter((r) => r.requiredDate && monthKeyOf(r.requiredDate) === selectedMonth), [records, selectedMonth]);

  const pace = useMemo(() => {
    if (!selectedMonth) return { totalWorkDays: 0, elapsedWorkDays: 0 };
    const [y, m] = selectedMonth.split("-").map(Number);
    return { totalWorkDays: workDaysInMonth(y, m), elapsedWorkDays: workDaysElapsedInMonth(y, m) };
  }, [selectedMonth]);

  const grouped = useMemo(() => groupByField(monthRecords, "rep"), [monthRecords]);

  const data = useMemo(() => {
    const withPace = grouped.map((d) => ({
      ...d,
      pace: pace.elapsedWorkDays > 0 ? (d.premium / pace.elapsedWorkDays) * pace.totalWorkDays : 0,
    }));
    return withPace.sort((a, b) => (metric === "count" ? b.count - a.count : (b[metric] as number) - (a[metric] as number)));
  }, [grouped, pace, metric]);

  const valueOf = (d: (typeof data)[number]) => (metric === "count" ? d.count : metric === "pace" ? d.pace : d.premium);
  const fmt = (v: number) => (metric === "count" ? formatNumber(v) : formatCurrency(v));

  const tableRows = data.map((d) => ({ key: d.key, value: fmt(valueOf(d)) }));

  const height = Math.max(180, data.length * 40);

  const subtitle =
    metric === "pace"
      ? `הערכה לפי ${pace.elapsedWorkDays} מתוך ${pace.totalWorkDays} ימי עבודה בחודש`
      : "בחר/י חודש להשוואת ביצועי הנציגים";

  return (
    <ChartCard
      title="מכירות לפי נציג — חודשי"
      subtitle={subtitle}
      toggle={
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs outline-none"
          >
            {months.length === 0 && <option value="">אין נתונים</option>}
            {months
              .slice()
              .reverse()
              .map((m) => (
                <option key={m} value={m}>
                  {formatMonthKeyShort(m)}
                </option>
              ))}
          </select>
          <RepMetricToggle metric={metric} onChange={setMetric} />
        </div>
      }
      tableRows={tableRows}
      delayMs={delayMs}
      chart={
        <div dir="ltr" style={{ height }}>
          {data.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-[var(--text-muted)]">אין נתונים לחודש שנבחר</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.map((d) => ({ key: d.key, value: valueOf(d) }))}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
              >
                <XAxis
                  type="number"
                  tickFormatter={fmt}
                  allowDecimals={metric === "count" ? false : undefined}
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis type="category" dataKey="key" tick={{ fill: "var(--text-primary)", fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip formatter={(item) => fmt(Number(item.value))} />} />
                <Bar
                  dataKey="value"
                  name={metric === "premium" ? "פרמיה" : metric === "count" ? "עסקאות" : "קצב חודשי"}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={22}
                  animationBegin={(delayMs ?? 0) + 150}
                  animationDuration={700}
                  animationEasing="ease-out"
                >
                  {data.map((d) => (
                    <Cell key={d.key} fill={colorFor(colorScale, d.key)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      }
    />
  );
}
