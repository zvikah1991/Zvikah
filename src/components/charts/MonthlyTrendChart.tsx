import { useId, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SalesRecord } from "../../types";
import { monthlyTrend } from "../../lib/aggregations";
import { currentMonthKey, formatCurrency, formatMonthKey, formatMonthKeyShort, formatNumber } from "../../lib/format";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { ChartCard, MetricToggle } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";

const MONTHS_BACK_OPTIONS = [
  { value: "6", label: "6 חודשים אחרונים" },
  { value: "12", label: "12 חודשים אחרונים" },
  { value: "24", label: "24 חודשים אחרונים" },
  { value: "all", label: "כל התקופה" },
];

export function MonthlyTrendChart({ records, delayMs }: { records: SalesRecord[]; delayMs?: number }) {
  const gradientId = `trend-bar-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [metric, setMetric] = useState<"premium" | "count">("premium");
  const [monthsBack, setMonthsBack] = useState<string>("12");
  // Bar value labels need real horizontal room per bar — on narrow screens they overlap, so
  // rely on the tooltip / table-view toggle there instead.
  const showBarLabels = useMediaQuery("(min-width: 640px)");
  const fullTrend = useMemo(() => monthlyTrend(records), [records]);
  const trend = useMemo(
    () => (monthsBack === "all" ? fullTrend : fullTrend.slice(-Number(monthsBack))),
    [fullTrend, monthsBack],
  );
  // Cap the number of labeled ticks so months never overlap, regardless of container width.
  const tickInterval = Math.max(0, Math.ceil(trend.length / 8) - 1);

  const tableRows = trend
    .slice()
    .reverse()
    .map((p) => ({
      key: formatMonthKey(p.monthKey),
      value: metric === "premium" ? formatCurrency(p.premium) : formatNumber(p.count),
    }));

  return (
    <ChartCard
      title="מכירות חודשי כללי"
      subtitle="לפי תאריך טיפול נדרש · לא מושפע מסינון התאריכים הראשי"
      toggle={
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={monthsBack}
            onChange={(e) => setMonthsBack(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs outline-none"
          >
            {MONTHS_BACK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <MetricToggle metric={metric} onChange={setMetric} />
        </div>
      }
      tableRows={tableRows}
      className="col-span-2"
      delayMs={delayMs}
      chart={
        <div dir="ltr" className="h-64">
          {trend.length === 0 ? (
            <NoData />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--series-1)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0.55} />
                  </linearGradient>
                  <linearGradient id={`${gradientId}-current`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.75} />
                  </linearGradient>
                </defs>
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
                  tickFormatter={(v) => (metric === "premium" ? formatCurrency(v) : formatNumber(v))}
                  allowDecimals={metric !== "premium" ? false : undefined}
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={78}
                />
                <Tooltip
                  cursor={{ fill: "var(--surface-2)" }}
                  content={
                    <ChartTooltip
                      formatter={(item) => (metric === "premium" ? formatCurrency(Number(item.value)) : formatNumber(Number(item.value)))}
                    />
                  }
                  labelFormatter={(label) => formatMonthKey(String(label))}
                />
                <Bar
                  dataKey={metric}
                  name={metric === "premium" ? "פרמיה" : "עסקאות"}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
                  animationBegin={(delayMs ?? 0) + 150}
                  animationDuration={700}
                  animationEasing="ease-out"
                >
                  {trend.map((p) => (
                    <Cell key={p.monthKey} fill={p.monthKey === currentMonthKey() ? `url(#${gradientId}-current)` : `url(#${gradientId})`} />
                  ))}
                  {showBarLabels && (
                    <LabelList
                      dataKey={metric}
                      position="top"
                      fill="var(--text-muted)"
                      fontSize={10}
                      zIndex={0}
                      formatter={(v: unknown) => {
                        const n = Number(v);
                        if (!n) return "";
                        return metric === "premium" ? formatCurrency(n) : formatNumber(n);
                      }}
                    />
                  )}
                </Bar>
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
