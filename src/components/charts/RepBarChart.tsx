import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SalesRecord } from "../../types";
import { groupByField } from "../../lib/aggregations";
import { colorFor } from "../../lib/colorScale";
import { formatCurrencyCompact, formatNumber } from "../../lib/format";
import { ChartCard, MetricToggle } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";

export function RepBarChart({ records, colorScale }: { records: SalesRecord[]; colorScale: Map<string, string> }) {
  const [metric, setMetric] = useState<"premium" | "count">("premium");
  const data = useMemo(() => groupByField(records, "rep").sort((a, b) => (metric === "premium" ? b.premium - a.premium : b.count - a.count)), [
    records,
    metric,
  ]);

  const tableRows = data.map((d) => ({
    key: d.key,
    value: metric === "premium" ? formatCurrencyCompact(d.premium) : formatNumber(d.count),
  }));

  const height = Math.max(180, data.length * 40);

  return (
    <ChartCard
      title="ביצועים לפי נציג"
      toggle={<MetricToggle metric={metric} onChange={setMetric} />}
      tableRows={tableRows}
      chart={
        <div dir="ltr" style={{ height }}>
          {data.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-[var(--text-muted)]">אין נתונים להצגה</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
                <XAxis
                  type="number"
                  tickFormatter={(v) => (metric === "premium" ? formatCurrencyCompact(v) : formatNumber(v))}
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="key"
                  tick={{ fill: "var(--text-primary)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip
                  cursor={{ fill: "var(--surface-2)" }}
                  content={
                    <ChartTooltip
                      formatter={(item) => (metric === "premium" ? formatCurrencyCompact(Number(item.value)) : formatNumber(Number(item.value)))}
                    />
                  }
                />
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
