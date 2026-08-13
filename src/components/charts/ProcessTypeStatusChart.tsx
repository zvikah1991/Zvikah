import { useMemo } from "react";
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SalesRecord } from "../../types";
import { statusBreakdownForProcessTypes } from "../../lib/aggregations";
import { buildColorScale, colorFor } from "../../lib/colorScale";
import { formatNumber } from "../../lib/format";
import { CORE_PROCESS_TYPES } from "../../config";
import { ChartCard } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";

export function ProcessTypeStatusChart({ records, delayMs }: { records: SalesRecord[]; delayMs?: number }) {
  const { rows, statuses } = useMemo(() => statusBreakdownForProcessTypes(records, CORE_PROCESS_TYPES), [records]);

  const colorScale = useMemo(() => buildColorScale(statuses.map((s) => ({ key: s, premium: 0, count: 0 }))), [statuses]);

  const tableRows = rows.map((row) => ({
    key: row.key,
    value: statuses
      .filter((s) => row.counts[s])
      .map((s) => `${s} ${formatNumber(row.counts[s])}`)
      .join(" · ") || "אין נתונים",
  }));

  const chartData = rows.map((row) => ({ key: row.key, ...row.counts }));
  const height = Math.max(160, rows.length * 90);

  return (
    <ChartCard
      title="שיחלוף מוצר ורכישת מוצר חדש — לפי סטטוס"
      subtitle="מספר עסקאות בכל סטטוס, לכל אחד משני סוגי התהליך"
      tableRows={tableRows}
      className="col-span-2"
      delayMs={delayMs}
      chart={
        <div dir="ltr" style={{ height }}>
          {rows.every((r) => r.total === 0) ? (
            <div className="grid h-full place-items-center text-sm text-[var(--text-muted)]">אין נתונים להצגה</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="key" tick={{ fill: "var(--text-primary)", fontSize: 12 }} axisLine={false} tickLine={false} width={130} />
                <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip formatter={(item) => formatNumber(Number(item.value))} />} />
                <Legend formatter={(value) => <span style={{ color: "var(--text-secondary)" }}>{value}</span>} wrapperStyle={{ fontSize: 12 }} />
                {statuses.map((status, i) => (
                  <Bar
                    key={status}
                    dataKey={status}
                    name={status}
                    stackId="status"
                    fill={colorFor(colorScale, status)}
                    radius={i === statuses.length - 1 ? [0, 4, 4, 0] : i === 0 ? [4, 0, 0, 4] : undefined}
                    maxBarSize={36}
                    animationBegin={(delayMs ?? 0) + 150 + i * 90}
                    animationDuration={500}
                    animationEasing="ease-out"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      }
    />
  );
}
