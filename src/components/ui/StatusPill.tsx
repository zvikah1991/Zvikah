import { statusBucket } from "../../lib/statusBuckets";

const COLORS: Record<string, string> = {
  good: "var(--status-good)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
  neutral: "var(--text-muted)",
};

export function StatusPill({ status }: { status: string | null }) {
  const bucket = statusBucket(status);
  const color = COLORS[bucket];
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: `color-mix(in oklab, ${color} 14%, transparent)`, color }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
      <span className="truncate">{status ?? "—"}</span>
    </span>
  );
}
