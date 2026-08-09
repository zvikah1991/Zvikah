import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SalesRecord } from "../../types";
import { groupByField } from "../../lib/aggregations";
import { colorFor } from "../../lib/colorScale";
import { formatCurrencyCompact, formatMonthKeyShort, formatNumber, monthKeyOf } from "../../lib/format";
import { ChartCard, MetricToggle } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";

export function RepByMonthChart({ records, colorScale }: { records: SalesRecord[]; colorScale: Map<string, string> }) {
  const [metric, setMetric] = useState<"premium" | "count">("premium");

  const months = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) if (r.requiredDate) set.add(monthKeyOf(r.requiredDate));
    return Array.from(set).sort();
  }, [records]);

  const [month, setMonth] = useState<string>("");
  const selectedMonth = months.includes(month) ? month : (months[months.length - 1] ?? "");

  const monthRecords = useMemo(() => records.filter((r) => r.requiredDate && monthKeyOf(r.requiredDate) === selectedMonth), [records, selectedMonth]);
  const data = useMemo(
    () => groupByField(monthRecords, "rep").sort((a, b) => (metric === "premium" ? b.premium - a.premium : b.count - a.count)),
    [monthRecords, metric],
  );

  const tableRows = data.map((d) => ({
    key: d.key,
    value: metric === "premium" ? formatCurrencyCompact(d.premium) : formatNumber(d.count),
  }));

  const height = Math.max(180, data.length * 40);
  const fmt = (v: number) => (metric === "premium" ? formatCurrencyCompact(v) : formatNumber(v));

  return (
    <ChartCard
      title="מכירות לפי נציג — חודשי"
      subtitle="בחר/י חודש להשוואת ביצועי הנציגים"
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
          <MetricToggle metric={metric} onChange={setMetric} />
        </div>
      }
      tableRows={tableRows}
      chart={
        <div dir="ltr" style={{ height }}>
          {data.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-[var(--text-muted)]">אין נתונים לחודש שנבחר</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
                <XAxis type="number" tickFormatter={fmt} allowDecimals={metric !== "premium" ? false : undefined} tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="key" tick={{ fill: "var(--text-primary)", fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip formatter={(item) => fmt(Number(item.value))} />} />
                <Bar dataKey={metric} name={metric === "premium" ? "פרמיה" : "עסקאות"} radius={[0, 4, 4, 0]} maxBarSize={22}>
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
