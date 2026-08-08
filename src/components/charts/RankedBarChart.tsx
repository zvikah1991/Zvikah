import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SalesRecord } from "../../types";
import { groupByField, topNWithOther } from "../../lib/aggregations";
import { colorFor } from "../../lib/colorScale";
import { formatCurrencyCompact, formatNumber } from "../../lib/format";
import { ChartCard, MetricToggle } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";

export function RankedBarChart({
  title,
  subtitle,
  records,
  field,
  colorScale,
  topN = 6,
}: {
  title: string;
  subtitle?: string;
  records: SalesRecord[];
  field: "insurer" | "productType" | "processType";
  colorScale: Map<string, string>;
  topN?: number;
}) {
  const [metric, setMetric] = useState<"premium" | "count">("premium");
  const data = useMemo(() => {
    const grouped = topNWithOther(groupByField(records, field), topN);
    return grouped.slice().sort((a, b) => (metric === "premium" ? b.premium - a.premium : b.count - a.count));
  }, [records, field, topN, metric]);

  const tableRows = data.map((d) => ({
    key: d.key,
    value: metric === "premium" ? formatCurrencyCompact(d.premium) : formatNumber(d.count),
  }));

  const height = Math.max(180, data.length * 36);

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
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
                  width={120}
                />
                <Tooltip
                  cursor={{ fill: "var(--surface-2)" }}
                  content={
                    <ChartTooltip
                      formatter={(item) => (metric === "premium" ? formatCurrencyCompact(Number(item.value)) : formatNumber(Number(item.value)))}
                    />
                  }
                />
                <Bar dataKey={metric} name={metric === "premium" ? "פרמיה" : "עסקאות"} radius={[0, 4, 4, 0]} maxBarSize={20}>
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
