import { useMemo, useState } from "react";
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SalesRecord } from "../../types";
import { statusByProcessType, topNProcessTypesWithOther } from "../../lib/aggregations";
import { statusBucket, STATUS_BUCKET_COLOR_VAR, STATUS_BUCKET_LABEL } from "../../lib/statusBuckets";
import { formatCurrencyCompact, formatNumber } from "../../lib/format";
import { ChartCard, MetricToggle } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";

function StatusLegend() {
  const items: Array<{ key: keyof typeof STATUS_BUCKET_LABEL }> = [{ key: "good" }, { key: "warning" }, { key: "critical" }];
  return (
    <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: STATUS_BUCKET_COLOR_VAR[item.key] }} />
          {STATUS_BUCKET_LABEL[item.key]}
        </li>
      ))}
    </ul>
  );
}

export function ProcessTypeStatusChart({ records }: { records: SalesRecord[] }) {
  const [metric, setMetric] = useState<"premium" | "count">("count");

  const data = useMemo(() => topNProcessTypesWithOther(statusByProcessType(records, statusBucket), 8), [records]);

  const goodKey = metric === "premium" ? "goodPremium" : "good";
  const warningKey = metric === "premium" ? "warningPremium" : "warning";
  const criticalKey = metric === "premium" ? "criticalPremium" : "critical";

  const tableRows = data.map((d) => ({
    key: d.key,
    value:
      metric === "premium"
        ? `${formatCurrencyCompact(d.totalPremium)} (${formatCurrencyCompact(d.goodPremium)} הופק · ${formatCurrencyCompact(d.warningPremium)} בטיפול · ${formatCurrencyCompact(d.criticalPremium)} בוטל)`
        : `${formatNumber(d.total)} (${formatNumber(d.good)} הופק · ${formatNumber(d.warning)} בטיפול · ${formatNumber(d.critical)} בוטל)`,
  }));

  const height = Math.max(200, data.length * 42);
  const fmt = (v: number) => (metric === "premium" ? formatCurrencyCompact(v) : formatNumber(v));

  return (
    <ChartCard
      title="מכירות וסטטוסים לפי סוג תהליך"
      subtitle="שיחלוף מוצר מול רכישת מוצר חדש ועוד — עם פילוח הצלחה"
      toggle={<MetricToggle metric={metric} onChange={setMetric} />}
      tableRows={tableRows}
      className="col-span-2"
      chart={
        <div dir="ltr" style={{ height }}>
          {data.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-[var(--text-muted)]">אין נתונים להצגה</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
                <XAxis
                  type="number"
                  tickFormatter={fmt}
                  allowDecimals={metric !== "premium" ? false : undefined}
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis type="category" dataKey="key" tick={{ fill: "var(--text-primary)", fontSize: 12 }} axisLine={false} tickLine={false} width={150} />
                <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip formatter={(item) => fmt(Number(item.value))} />} />
                <Legend content={<StatusLegend />} />
                <Bar
                  dataKey={goodKey}
                  name={STATUS_BUCKET_LABEL.good}
                  stackId="status"
                  fill={STATUS_BUCKET_COLOR_VAR.good}
                  radius={[0, 0, 0, 0]}
                  maxBarSize={20}
                />
                <Bar
                  dataKey={warningKey}
                  name={STATUS_BUCKET_LABEL.warning}
                  stackId="status"
                  fill={STATUS_BUCKET_COLOR_VAR.warning}
                  maxBarSize={20}
                />
                <Bar
                  dataKey={criticalKey}
                  name={STATUS_BUCKET_LABEL.critical}
                  stackId="status"
                  fill={STATUS_BUCKET_COLOR_VAR.critical}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      }
    />
  );
}
