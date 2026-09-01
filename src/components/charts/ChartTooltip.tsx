interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  formatter?: (item: TooltipPayloadItem) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className="min-w-36 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-xs"
      style={{ boxShadow: "var(--shadow-xl)" }}
    >
      {label && <div className="mb-1.5 border-b border-[var(--border)] pb-1.5 font-semibold text-[var(--text-primary)]">{label}</div>}
      <div className="flex flex-col gap-1.5">
        {payload.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
            <span className="text-[var(--text-secondary)]">{item.name}</span>
            <span className="ms-auto font-semibold tabular-nums text-[var(--text-primary)]">
              {formatter ? formatter(item) : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
