import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SalesRecord } from "../../types";
import { monthlyTrend } from "../../lib/aggregations";
import { formatCurrencyCompact, formatMonthKey, formatMonthKeyShort, formatNumber } from "../../lib/format";
import { ChartCard, MetricToggle } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";

export function MonthlyTrendChart({ records }: { records: SalesRecord[] }) {
  const [metric, setMetric] = useState<"premium" | "count">("premium");
  const trend = useMemo(() => monthlyTrend(records), [records]);
  // Cap the number of labeled ticks so months never overlap, regardless of container width.
  const tickInterval = Math.max(0, Math.ceil(trend.length / 8) - 1);

  const tableRows = trend
    .slice()
    .reverse()
    .map((p) => ({
      key: formatMonthKey(p.monthKey),
      value: metric === "premium" ? formatCurrencyCompact(p.premium) : formatNumber(p.count),
    }));

  return (
    <ChartCard
      title="מכירות לפי חודש"
      subtitle="לפי תאריך טיפול נדרש"
      toggle={<MetricToggle metric={metric} onChange={setMetric} />}
      tableRows={tableRows}
      className="col-span-2"
      chart={
        <div dir="ltr" className="h-64">
          {trend.length === 0 ? (
            <NoData />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--grid)" />
                <XAxis
                  dataKey="monthKey"
                  interval={tickInterval}
                  tickFormatter={formatMonthKeyShort}
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--baseline)" }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => (metric === "premium" ? formatCurrencyCompact(v) : formatNumber(v))}
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  cursor={{ fill: "var(--surface-2)" }}
                  content={
                    <ChartTooltip
                      formatter={(item) => (metric === "premium" ? formatCurrencyCompact(Number(item.value)) : formatNumber(Number(item.value)))}
                    />
                  }
                  labelFormatter={(label) => formatMonthKey(String(label))}
                />
                <Bar dataKey={metric} name={metric === "premium" ? "פרמיה" : "עסקאות"} fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      }
    />
  );
}

function NoData() {
  return <div className="grid h-full place-items-center text-sm text-[var(--text-muted)]">אין נתונים להצגה</div>;
}
