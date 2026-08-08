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
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs shadow-lg">
      {label && <div className="mb-1 font-medium text-[var(--text-primary)]">{label}</div>}
      <div className="flex flex-col gap-1">
        {payload.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
            <span className="text-[var(--text-secondary)]">{item.name}</span>
            <span className="ms-auto font-medium tabular-nums text-[var(--text-primary)]">
              {formatter ? formatter(item) : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
