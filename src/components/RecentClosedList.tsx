import { useMemo } from "react";
import type { SalesRecord } from "../types";
import { recentClosedDeals } from "../lib/customers";
import { statusBucket } from "../lib/statusBuckets";
import { formatCurrency, formatDate } from "../lib/format";
import { Card } from "./ui/Card";
import { SectionTitle } from "./ui/SectionTitle";
import { IconCheck } from "./ui/Icons";

export function RecentClosedList({ records, delayMs }: { records: SalesRecord[]; delayMs?: number }) {
  const deals = useMemo(() => recentClosedDeals(records, statusBucket, 10), [records]);

  return (
    <Card className="animate-fade-up p-4" style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}>
      <SectionTitle>לקוחות שנסגרו לאחרונה</SectionTitle>
      <p className="mt-0.5 text-xs text-[var(--text-muted)]">10 העסקאות האחרונות שהופקו / הושלמו</p>

      <ul className="mt-2.5 flex flex-col">
        {deals.map((r, i) => (
          <li
            key={r.id}
            className="animate-fade-up flex items-center gap-3 border-s-2 border-s-transparent border-b border-[var(--border)] px-1.5 py-2 transition-colors last:border-b-0 hover:border-s-[var(--status-good)] hover:bg-[var(--surface-2)]/60"
            style={{ animationDelay: `${(delayMs ?? 0) + 120 + i * 45}ms` }}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]">
              <IconCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{r.customer ?? "—"}</div>
              <div className="truncate text-xs text-[var(--text-muted)]">
                {r.rep ?? "—"} · {r.productType ?? r.processType ?? "—"}
              </div>
            </div>
            <div className="shrink-0 text-end">
              <div className="text-sm font-semibold tabular-nums">{r.expectedPremium !== null ? formatCurrency(r.expectedPremium) : "—"}</div>
              <div className="text-xs text-[var(--text-muted)] tabular-nums">{formatDate(r.requiredDate)}</div>
            </div>
          </li>
        ))}
        {deals.length === 0 && <li className="py-6 text-center text-sm text-[var(--text-muted)]">אין עסקאות שנסגרו בטווח הנוכחי</li>}
      </ul>
    </Card>
  );
}
