import { useMemo } from "react";
import type { SalesRecord } from "../types";
import { overdueDeals } from "../lib/customers";
import { statusBucket } from "../lib/statusBuckets";
import { formatCurrency, formatNumber, todayISO, daysBetween } from "../lib/format";
import { Card } from "./ui/Card";
import { SectionTitle } from "./ui/SectionTitle";
import { IconClock } from "./ui/Icons";

export function OverdueDealsList({ records, delayMs }: { records: SalesRecord[]; delayMs?: number }) {
  const deals = useMemo(() => {
    const today = todayISO();
    return overdueDeals(records, statusBucket, today, 10).map((r) => ({ ...r, daysLate: daysBetween(r.requiredDate!, today) }));
  }, [records]);

  return (
    <Card className="animate-fade-up p-4" style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}>
      <SectionTitle>עסקאות באיחור — דורשות מעקב</SectionTitle>
      <p className="mt-0.5 text-xs text-[var(--text-muted)]">בטיפול, ותאריך הטיפול הנדרש כבר עבר · הוותיקות ביותר קודם</p>

      <ul className="mt-3 flex flex-col gap-1">
        {deals.map((r, i) => (
          <li
            key={r.id}
            className="animate-fade-up flex items-center gap-3 rounded-lg px-1.5 py-2 hover:bg-[var(--surface-2)]/60"
            style={{ animationDelay: `${(delayMs ?? 0) + 120 + i * 45}ms` }}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--status-warning)_18%,transparent)] text-[var(--status-warning)]">
              <IconClock className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{r.customer ?? "—"}</div>
              <div className="truncate text-xs text-[var(--text-muted)]">
                {r.rep ?? "—"} · {r.productType ?? r.processType ?? "—"}
              </div>
            </div>
            <div className="shrink-0 text-end">
              <div className="text-sm font-medium tabular-nums">{r.expectedPremium !== null ? formatCurrency(r.expectedPremium) : "—"}</div>
              <div className="text-xs tabular-nums text-[var(--status-critical)]">{formatNumber(r.daysLate)} ימים באיחור</div>
            </div>
          </li>
        ))}
        {deals.length === 0 && <li className="py-6 text-center text-sm text-[var(--text-muted)]">אין עסקאות באיחור בטווח הנוכחי</li>}
      </ul>
    </Card>
  );
}
