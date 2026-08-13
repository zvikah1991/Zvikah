import { useState, type ReactNode } from "react";
import clsx from "clsx";
import { Card } from "../ui/Card";

export interface ChartTableRow {
  key: string;
  value: string;
}

export function ChartCard({
  title,
  subtitle,
  toggle,
  chart,
  tableRows,
  className,
  delayMs,
}: {
  title: string;
  subtitle?: string;
  toggle?: ReactNode;
  chart: ReactNode;
  tableRows: ChartTableRow[];
  className?: string;
  delayMs?: number;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");

  return (
    <Card className={clsx("animate-fade-up p-4", className)} style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
          {subtitle && <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {toggle}
          <div className="flex rounded-lg border border-[var(--border)] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setView("chart")}
              className={clsx("rounded-md px-2 py-1", view === "chart" ? "bg-[var(--surface-2)] font-medium" : "text-[var(--text-muted)]")}
            >
              תרשים
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={clsx("rounded-md px-2 py-1", view === "table" ? "bg-[var(--surface-2)] font-medium" : "text-[var(--text-muted)]")}
            >
              טבלה
            </button>
          </div>
        </div>
      </div>

      {view === "chart" ? (
        chart
      ) : (
        <div className="max-h-72 overflow-auto scrollbar-thin">
          <table className="w-full text-sm">
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.key} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-1.5 pe-2 text-[var(--text-secondary)]">{row.key}</td>
                  <td className="py-1.5 text-end font-medium tabular-nums">{row.value}</td>
                </tr>
              ))}
              {tableRows.length === 0 && (
                <tr>
                  <td className="py-4 text-center text-[var(--text-muted)]">אין נתונים</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function MetricToggle({ metric, onChange }: { metric: "premium" | "count"; onChange: (m: "premium" | "count") => void }) {
  return (
    <div className="flex rounded-lg border border-[var(--border)] p-0.5 text-xs">
      <button
        type="button"
        onClick={() => onChange("premium")}
        className={clsx("rounded-md px-2 py-1", metric === "premium" ? "bg-[var(--surface-2)] font-medium" : "text-[var(--text-muted)]")}
      >
        פרמיה
      </button>
      <button
        type="button"
        onClick={() => onChange("count")}
        className={clsx("rounded-md px-2 py-1", metric === "count" ? "bg-[var(--surface-2)] font-medium" : "text-[var(--text-muted)]")}
      >
        כמות
      </button>
    </div>
  );
}
