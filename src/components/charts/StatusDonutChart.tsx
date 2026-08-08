import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { SalesRecord } from "../../types";
import { groupByField, sortByMetric, topNWithOther } from "../../lib/aggregations";
import { colorFor } from "../../lib/colorScale";
import { formatNumber, formatPercent } from "../../lib/format";
import { ChartCard } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";

export function StatusDonutChart({ records, colorScale }: { records: SalesRecord[]; colorScale: Map<string, string> }) {
  const data = useMemo(() => topNWithOther(sortByMetric(groupByField(records, "status"), "count"), 7), [records]);
  const total = data.reduce((s, d) => s + d.count, 0);

  const tableRows = data.map((d) => ({
    key: d.key,
    value: `${formatNumber(d.count)} (${formatPercent(total ? d.count / total : 0)})`,
  }));

  return (
    <ChartCard
      title="פילוח סטטוסים"
      subtitle="לפי מספר עסקאות"
      tableRows={tableRows}
      chart={
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center">
          <div dir="ltr" className="h-56 w-full sm:w-1/2">
            {data.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-[var(--text-muted)]">אין נתונים להצגה</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="count"
                    nameKey="key"
                    innerRadius="58%"
                    outerRadius="88%"
                    paddingAngle={2}
                    stroke="var(--surface)"
                    strokeWidth={2}
                  >
                    {data.map((d) => (
                      <Cell key={d.key} fill={colorFor(colorScale, d.key)} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <ChartTooltip formatter={(item) => `${formatNumber(Number(item.value))} (${formatPercent(total ? Number(item.value) / total : 0)})`} />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ul className="grid w-full grid-cols-1 gap-1.5 text-xs sm:w-1/2">
            {data.map((d) => (
              <li key={d.key} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorFor(colorScale, d.key) }} />
                <span className="truncate text-[var(--text-secondary)]">{d.key}</span>
                <span className="ms-auto shrink-0 font-medium tabular-nums">{formatNumber(d.count)}</span>
              </li>
            ))}
          </ul>
        </div>
      }
    />
  );
}
