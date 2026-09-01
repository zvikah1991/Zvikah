import { useMemo, useState } from "react";
import type { SalesRecord } from "../../types";
import { groupByField, topNWithOther } from "../../lib/aggregations";
import { colorFor } from "../../lib/colorScale";
import { formatCurrency, formatNumber } from "../../lib/format";
import { ChartCard, MetricToggle } from "./ChartCard";

/**
 * A ranked-list visualization rather than a generic horizontal bar chart: each row carries
 * its own proportional fill, rank number and value in one compact line — reads more like an
 * editorial leaderboard than a chart-library default, while showing exactly the same data.
 */
export function RankedBarChart({
  title,
  subtitle,
  records,
  field,
  colorScale,
  topN = 6,
  delayMs,
}: {
  title: string;
  subtitle?: string;
  records: SalesRecord[];
  field: "insurer" | "productType" | "processType";
  colorScale: Map<string, string>;
  topN?: number;
  delayMs?: number;
}) {
  const [metric, setMetric] = useState<"premium" | "count">("premium");
  const data = useMemo(() => {
    const grouped = topNWithOther(groupByField(records, field), topN);
    return grouped.slice().sort((a, b) => (metric === "premium" ? b.premium - a.premium : b.count - a.count));
  }, [records, field, topN, metric]);

  const tableRows = data.map((d) => ({
    key: d.key,
    value: metric === "premium" ? formatCurrency(d.premium) : formatNumber(d.count),
  }));

  const max = Math.max(1, ...data.map((d) => (metric === "premium" ? d.premium : d.count)));

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      toggle={<MetricToggle metric={metric} onChange={setMetric} />}
      tableRows={tableRows}
      delayMs={delayMs}
      chart={
        data.length === 0 ? (
          <div className="grid h-40 place-items-center text-sm text-[var(--text-muted)]">אין נתונים להצגה</div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {data.map((d, i) => {
              const value = metric === "premium" ? d.premium : d.count;
              const width = Math.max(3, (value / max) * 100);
              const color = colorFor(colorScale, d.key);
              return (
                <li key={d.key} className="flex items-center gap-3">
                  <span className="w-4 shrink-0 text-end text-xs font-semibold tabular-nums text-[var(--text-muted)]">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium text-[var(--text-primary)]">{d.key}</span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                        {metric === "premium" ? formatCurrency(d.premium) : formatNumber(d.count)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                      <div
                        className="animate-grow-width h-full rounded-full"
                        style={
                          {
                            width: `${width}%`,
                            background: color,
                            animationDelay: `${(delayMs ?? 0) + 150 + i * 60}ms`,
                            "--grow-to": `${width}%`,
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      }
    />
  );
}
