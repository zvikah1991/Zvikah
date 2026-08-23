import { useMemo, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AdsDayRecord } from "../../types";
import { adsMonthlyTrend, distinctAdsMonths } from "../../lib/adsAggregations";
import { formatCurrency, formatMonthKey } from "../../lib/format";
import { ChartCard } from "../charts/ChartCard";
import { ChartTooltip } from "../charts/ChartTooltip";

export function AdsTrendChart({ records, monthlyBudget, delayMs }: { records: AdsDayRecord[]; monthlyBudget: number; delayMs?: number }) {
  const months = useMemo(() => distinctAdsMonths(records), [records]);
  const [monthKey, setMonthKey] = useState(months[0] ?? "");
  const activeMonth = months.includes(monthKey) ? monthKey : (months[0] ?? "");

  const trend = useMemo(
    () => (activeMonth ? adsMonthlyTrend(records, activeMonth, monthlyBudget) : []),
    [records, activeMonth, monthlyBudget],
  );

  const tableRows = trend
    .filter((p) => p.cost > 0 || p.calls > 0)
    .slice()
    .reverse()
    .map((p) => ({ key: p.date, value: `${formatCurrency(p.cost)} · ${p.calls} שיחות` }));

  return (
    <ChartCard
      title="הוצאה יומית מול קצב התקציב"
      subtitle="עמודות = הוצאה יומית בפועל · קו רציף = הוצאה מצטברת · קו מקווקו = יעד תקציב לפי קצב אחיד"
      toggle={
        months.length > 1 ? (
          <select
            value={activeMonth}
            onChange={(e) => setMonthKey(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs outline-none"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonthKey(m)}
              </option>
            ))}
          </select>
        ) : undefined
      }
      tableRows={tableRows}
      className="col-span-2"
      delayMs={delayMs}
      chart={
        <div dir="ltr" className="h-64">
          {trend.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-[var(--text-muted)]">אין נתונים להצגה</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--grid)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) => d.slice(8, 10)}
                  interval={Math.max(0, Math.ceil(trend.length / 10) - 1)}
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--baseline)" }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatCurrency(v)}
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={78}
                />
                <Tooltip
                  cursor={{ fill: "var(--surface-2)" }}
                  content={<ChartTooltip formatter={(item) => formatCurrency(Number(item.value))} />}
                  labelFormatter={(label) => `${label}`}
                />
                <Bar dataKey="cost" name="הוצאה יומית" fill="var(--series-1)" radius={[3, 3, 0, 0]} maxBarSize={18} />
                <Line type="monotone" dataKey="cumulativeCost" name="הוצאה מצטברת" stroke="var(--series-3)" strokeWidth={2} dot={false} />
                <Line
                  type="linear"
                  dataKey="budgetPace"
                  name="יעד תקציב"
                  stroke="var(--text-muted)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      }
    />
  );
}
